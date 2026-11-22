# MyMind

Il quaderno di lavoro privato per psicologhe e psicoterapeute dell'età evolutiva.

**Funzioni principali**
- **Agenda:** settimana a griglia oraria, con importazione del palinsesto del centro da Excel, CSV o testo e confronto automatico con la settimana precedente (nuovi, spostati, rimossi).
- **Schede dei bambini:** anagrafica, consenso informato di entrambi i genitori, quadro clinico, obiettivi del percorso.
- **Diario degli incontri:** valutazione degli obiettivi da 1 a 5 e grafici dei progressi.
- **Report per i genitori:** grafici "all'inizio e oggi" e andamento nel tempo, stampabili o salvabili in PDF.
- **Importazione dell'archivio:** appunti esistenti da Word, Excel o testo, divisi in note per data, ed elenchi di bambini da Excel.
- **Prestazioni:** conteggio mensile con riepilogo per la fattura ed esportazione CSV.

## Privacy
- **Dati solo sul dispositivo:** tutti i dati restano sul dispositivo, cifrati con **AES-256-GCM**.
- **Chiave dei dati:** è casuale ed è protetta dalla password (PBKDF2-SHA256, 600.000 iterazioni) e da una **chiave di recupero** mostrata alla prima apertura.
- **Nessuna connessione:** l'app **non effettua connessioni di rete**. La Content Security Policy (`connect-src 'none'`) lo impedisce a livello di browser. Non ci sono account, analisi, pubblicità o servizi esterni. Font e librerie sono inclusi nel repository.
- **Backup:** è un file `.mymind` cifrato, da salvare su iCloud Drive o Google Drive. Senza password o chiave di recupero il file è illeggibile.
- **Nessun dato nel repository:** questo repository contiene solo il codice dell'app, mai dati personali.

## Installazione sul telefono
1. Apri l'indirizzo dell'app con **Safari** (iPhone) o **Chrome** (Android).
2. iPhone: *Condividi → Aggiungi alla schermata Home*. Android: *menu ⋮ → Installa app*.
3. Crea la password e conserva la chiave di recupero.

## Su un nuovo dispositivo
Apri MyMind, scegli **"Ho già un backup: ripristina"**, seleziona il file da iCloud Drive o Google Drive e inserisci la password.

## Pubblicazione
È un sito statico: GitHub Pages lo pubblica dalla cartella principale del branch `main`.

## Licenze di terze parti
- Figtree e Newsreader: SIL Open Font License.
- SheetJS Community Edition: Apache 2.0.
- mammoth.js: BSD-2-Clause.
- tesseract.js e tesseract.js-core: Apache 2.0. Dati linguistici Tesseract (italiano): Apache 2.0.
