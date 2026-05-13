/**
 * MODULE CLIENTS 360 - Synthèse globale et Suivi
 */
const ClientsModule = {
    currentClient: null,
    craData: [],
    clientRecords: [],
    charts: {},

    init() {
        console.log("🏢 Espace Client 360 Initialisé");
        
        // 1. Charger toutes les données du CRAminator
        const sources = Storage.get('cra_data_sources', {});
        this.craData = [];
        Object.values(sources).forEach(src => {
            if (src.data) this.craData = this.craData.concat(src.data);
        });

        // 2. Extraire la liste unique des clients
        const clientsSet = new Set();
        this.craData.forEach(r => { if(r.client && r.client !== "N/A") clientsSet.add(r.client); });
        const clientsList = Array.from(clientsSet).sort();

        // 3. Remplir le menu déroulant
        const select = document.getElementById('client360-selector');
        if (select) {
            select.innerHTML = '<option value="">-- Choisir un client --</option>' + 
                clientsList.map(c => `<option value="${c.replace(/"/g, '&quot;')}">${c}</option>`).join('');
            
            // Si on a déjà un client sélectionné en mémoire, on le remet
            if (this.currentClient && clientsList.includes(this.currentClient)) {
                select.value = this.currentClient;
                this.selectClient(this.currentClient);
            }
        }
    },

    selectClient(clientName) {
        if (!clientName) {
            document.getElementById('client360-empty').style.display = 'block';
            document.getElementById('client360-fiche').style.display = 'none';
            document.getElementById('client360-suivi').style.display = 'none';
            this.currentClient = null;
            return;
        }

        this.currentClient = clientName;
        document.getElementById('client360-empty').style.display = 'none';
        
        // Filtrer les données CRA pour ce client unique
        this.clientRecords = this.craData.filter(r => r.client === clientName);

        // Restaurer les infos sauvegardées (TJM, Contact...)
        const allInfos = Storage.get('clients_infos', {});
        const myInfo = allInfos[clientName] || { tjm: 600, contact: '', email: '', ref: '' };
        
        document.getElementById('info-tjm').value = myInfo.tjm;
        document.getElementById('info-contact').value = myInfo.contact;
        document.getElementById('info-email').value = myInfo.email;
        document.getElementById('info-ref').value = myInfo.ref;

        // Mettre à jour l'interface
        this.updateFicheStats(myInfo.tjm);
        this.renderHistory();

        // S'assurer que le bon onglet est affiché
        const isSuiviActive = document.getElementById('tab-suivi').style.borderBottomColor !== 'transparent';
        this.switchTab(isSuiviActive ? 'suivi' : 'fiche');
    },

    saveInfos() {
        if (!this.currentClient) return;
        const allInfos = Storage.get('clients_infos', {});
        
        const tjmVal = parseFloat(document.getElementById('info-tjm').value) || 0;
        
        allInfos[this.currentClient] = {
            tjm: tjmVal,
            contact: document.getElementById('info-contact').value,
            email: document.getElementById('info-email').value,
            ref: document.getElementById('info-ref').value
        };
        Storage.set('clients_infos', allInfos);
        
        // Mettre à jour le CA instantanément avec le nouveau TJM
        this.updateFicheStats(tjmVal);
    },

    updateFicheStats(tjm) {
        document.getElementById('fiche-client-name').textContent = this.currentClient;

        // 1. Calculs Jours et CA
        const totalJours = this.clientRecords.reduce((sum, r) => sum + r.jours, 0);
        document.getElementById('fiche-jours').textContent = totalJours.toFixed(2) + ' jrs';
        document.getElementById('fiche-ca-total').textContent = (totalJours * tjm).toLocaleString('fr-FR') + ' €';

        // 2. Équipe (Collaborateurs uniques)
        const collabsSet = new Set();
        this.clientRecords.forEach(r => collabsSet.add(r.collaborateur));
        const collabsArr = Array.from(collabsSet);
        document.getElementById('fiche-collabs-count').textContent = collabsArr.length;
        document.getElementById('fiche-collabs-list').textContent = collabsArr.join(', ') || 'Aucun collaborateur identifié.';

        // 3. Tableau des Missions
        const missionsMap = {};
        this.clientRecords.forEach(r => {
            // Dans le CRAminator, la mission/projet est souvent gérée via 'tache' ou on groupe tout.
            // On va utiliser un mix ou "Général" si on n'a pas de colonne mission explicite
            const m = r.mission || r.tache || 'Général';
            if (!missionsMap[m]) missionsMap[m] = 0;
            missionsMap[m] += r.jours;
        });

        const tbody = document.getElementById('fiche-missions-body');
        tbody.innerHTML = Object.entries(missionsMap).sort((a,b)=>b[1]-a[1]).map(([name, jours]) => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 10px 16px; font-weight: 600; color: var(--primary);">${name}</td>
                <td style="padding: 10px 16px; text-align: right; color: var(--brand); font-weight: bold;">${jours.toFixed(2)}</td>
                <td style="padding: 10px 16px; text-align: right;">${(jours * tjm).toLocaleString('fr-FR')} €</td>
            </tr>
        `).join('');

        // 4. Graphiques
        this.renderCharts();
    },

    renderCharts() {
        if (typeof Chart === 'undefined') return;
        const colors = ['#1B3B5C', '#5EB091', '#4491B6', '#E9BD27', '#E75B3C', '#94A3B8'];

        // Tâches
        const taskMap = {};
        this.clientRecords.forEach(r => {
            const t = r.tache || 'Autre';
            if(!taskMap[t]) taskMap[t] = 0;
            taskMap[t] += r.jours;
        });
        const taskData = Object.entries(taskMap).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);

        if (this.charts.task) this.charts.task.destroy();
        this.charts.task = new Chart(document.getElementById('clientTaskChart').getContext('2d'), {
            type: 'doughnut',
            data: { labels: taskData.map(d=>d.name), datasets: [{ data: taskData.map(d=>d.value), backgroundColor: colors }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: {size: 10} } } } }
        });

        // Évolution (Temps)
        const timeMap = {};
        this.clientRecords.forEach(r => {
            const dateStr = r.date ? r.date.substring(0, 7) : 'Inconnu'; // YYYY-MM
            if(dateStr === 'Inconnu') return;
            if(!timeMap[dateStr]) timeMap[dateStr] = 0;
            timeMap[dateStr] += r.jours;
        });
        const timeData = Object.entries(timeMap).sort();

        if (this.charts.time) this.charts.time.destroy();
        this.charts.time = new Chart(document.getElementById('clientTimeChart').getContext('2d'), {
            type: 'bar',
            data: { labels: timeData.map(d=>d[0]), datasets: [{ label: 'Jours consommés', data: timeData.map(d=>d[1]), backgroundColor: '#5EB091', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    },

    switchTab(tab) {
        if (!this.currentClient) return;
        const fiche = document.getElementById('client360-fiche');
        const suivi = document.getElementById('client360-suivi');
        const btnFiche = document.getElementById('tab-fiche');
        const btnSuivi = document.getElementById('tab-suivi');

        if (tab === 'fiche') {
            fiche.style.display = 'block';
            suivi.style.display = 'none';
            btnFiche.style.borderBottomColor = 'var(--brand)';
            btnFiche.style.color = 'var(--brand)';
            btnSuivi.style.borderBottomColor = 'transparent';
            btnSuivi.style.color = 'var(--ink-muted)';
        } else {
            fiche.style.display = 'none';
            suivi.style.display = 'grid'; // Utilise le grid pour l'affichage à deux colonnes
            btnSuivi.style.borderBottomColor = 'var(--brand)';
            btnSuivi.style.color = 'var(--brand)';
            btnFiche.style.borderBottomColor = 'transparent';
            btnFiche.style.color = 'var(--ink-muted)';
        }
    },

    // --- LOGIQUE SUIVI HEBDO ---

    saveComment() {
        if (!this.currentClient) return;

        const semaine = document.getElementById('form-semaine').value;
        const cat = document.getElementById('form-cat').value;
        const parts = document.getElementById('form-parts').value;
        const env = document.getElementById('form-env').value;
        const sujets = document.getElementById('form-sujets').value;
        const alertes = document.getElementById('form-alertes').value;
        const auteur = document.getElementById('form-auteur').value;

        if (!semaine) return alert("Veuillez choisir une semaine.");

        const newComment = {
            id: Date.now().toString(),
            client: this.currentClient,
            date: new Date().toISOString(),
            semaine, cat, parts, env, sujets, alertes, auteur
        };

        const allComments = Storage.get('clients_comments', []);
        allComments.unshift(newComment);
        Storage.set('clients_comments', allComments);

        // Vider le form
        document.getElementById('form-parts').value = '';
        document.getElementById('form-env').value = '';
        document.getElementById('form-sujets').value = '';
        document.getElementById('form-alertes').value = '';

        this.renderHistory();
    },

    renderHistory() {
        const container = document.getElementById('suivi-history-list');
        if (!container) return;

        const allComments = Storage.get('clients_comments', []);
        const clientComments = allComments.filter(c => c.client === this.currentClient);

        if (clientComments.length === 0) {
            container.innerHTML = '<div style="color:var(--ink-muted); text-align:center; padding: 20px;">Aucun historique pour ce client.</div>';
            return;
        }

        container.innerHTML = clientComments.map(c => `
            <div class="card" style="padding: 16px; border-left: 4px solid ${c.alertes ? '#ef4444' : 'var(--brand)'};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                    <div>
                        <span style="font-weight: 700; color: var(--primary);">${c.semaine}</span> • 
                        <span style="font-size: 12px; color: var(--ink-muted);">${c.cat}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--ink-muted);">Par ${c.auteur}</div>
                </div>
                ${c.parts ? `<div style="font-size: 12px; margin-bottom: 8px;"><b>👤 Participants:</b> ${c.parts}</div>` : ''}
                ${c.env ? `<div style="font-size: 12px; margin-bottom: 8px;"><b>💰 Enveloppes:</b><br/>${c.env.replace(/\n/g, '<br>')}</div>` : ''}
                ${c.sujets ? `<div style="font-size: 12px; margin-bottom: 8px;"><b>🚀 Avancement:</b><br/>${c.sujets.replace(/\n/g, '<br>')}</div>` : ''}
                ${c.alertes ? `<div style="font-size: 12px; color: #b91c1c; background: #fef2f2; padding: 8px; border-radius: 4px; margin-top: 8px;"><b>⚠️ Alertes:</b><br/>${c.alertes.replace(/\n/g, '<br>')}</div>` : ''}
                
                <div style="text-align: right; margin-top: 8px;">
                    <button onclick="ClientsModule.deleteComment('${c.id}')" style="background:none; border:none; color: #ef4444; font-size: 11px; cursor: pointer; text-decoration: underline;">Supprimer</button>
                </div>
            </div>
        `).join('');
    },

    deleteComment(id) {
        if (!confirm("Supprimer ce commentaire ?")) return;
        let allComments = Storage.get('clients_comments', []);
        allComments = allComments.filter(c => c.id !== id);
        Storage.set('clients_comments', allComments);
        this.renderHistory();
    },

    // --- EXPORT WORD (Librairie docx) ---
    exportWord() {
        if (typeof docx === 'undefined') {
            alert("La librairie docx n'est pas chargée. Vérifiez votre index.html.");
            return;
        }
        if (!this.currentClient) return;

        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const totalJours = document.getElementById('fiche-jours').textContent;
        const caTotal = document.getElementById('fiche-ca-total').textContent;
        
        // Récupérer le dernier commentaire pour le rapport
        const allComments = Storage.get('clients_comments', []);
        const clientComments = allComments.filter(c => c.client === this.currentClient);
        const dernierPoint = clientComments.length > 0 ? clientComments[0] : null;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: `Fiche d'identité : ${this.currentClient}`, heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun({ text: "Synthèse Financière et Temps", bold: true })] }),
                    new Paragraph({ text: `Jours consommés au total : ${totalJours}` }),
                    new Paragraph({ text: `Chiffre d'Affaires estimé : ${caTotal}` }),
                    
                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({ children: [new TextRun({ text: "Dernier point de suivi", bold: true })] }),
                    
                    dernierPoint ? new Paragraph({ text: `Semaine: ${dernierPoint.semaine} | Catégorie: ${dernierPoint.cat}` }) : new Paragraph({ text: "Aucun point enregistré." }),
                    dernierPoint && dernierPoint.sujets ? new Paragraph({ text: `Avancement :\n${dernierPoint.sujets}` }) : new Paragraph({ text: "" }),
                    dernierPoint && dernierPoint.alertes ? new Paragraph({ text: `Alertes :\n${dernierPoint.alertes}` }) : new Paragraph({ text: "" }),
                ],
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Fiche_Client_${this.currentClient.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }
};

window.ClientsModule = ClientsModule;
