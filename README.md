![Better English AI banner](assets/better-english-AI-banner.png)

# Better English AI

Better English AI helps learners practise English through conversation.
Speak with an AI partner and receive feedback on what you say.
Explore pronunciation practice to work on spoken English.
Pronunciation practice selects from 48 prepared sentences across eight sound groups, in a varied order that favours difficult sounds and due reviews.
Clear attempts with recognized phonemes and a phoneme error rate of at most 5% schedule the sentence for review after 1, 2, 4, 8, 16, then 30 days. Repeating the same displayed sentence does not advance this interval; errors bring it back for review after ten minutes.
Recent sentences are avoided, and new sentences remain part of practice. If every available sentence is scheduled for later, the earliest upcoming review is offered so practice can continue.
Progress is stored as versioned JSON in browser local storage, without SQLite or extra AI calls. It persists across visits in the same browser and origin; clearing site data resets it. If storage is unavailable, practice continues for the current visit.
Pronunciation observations are approximate, so a clear attempt is evidence for scheduling rather than a guarantee of perfect pronunciation.
Use writing practice to improve grammar, spelling, and word choice.
Review corrections and explanations alongside your writing.
Listen to spoken replies during voice conversations.
In voice and writing practice, enter a topic or choose a suggestion and select **Let AI start**.
Your English partner opens with a question; reply by speaking or writing to continue on that topic.
Voice openings include playable audio when speech generation is available. You can also start the conversation yourself.
Select **New conversation** to clear the topic and messages and cancel any pending opening request.
The compact workspace keeps navigation and recording or writing controls visible. Long conversations, results, and settings scroll within their content area. Small landscape windows and high zoom allow page scrolling to keep controls accessible.
A red reminder below the settings gear appears only when the backend reports that no GLM API key is configured.
Set up the application locally and practise at your own pace.
Speech recognition, pronunciation analysis, and voice generation run locally on CPU.
Conversation and corrections use the GLM API.

---

## Quickstart

### Install

Requires Python 3.12+, uv, Node.js 22.12+, npm, ffmpeg, and eSpeak NG. On Debian or Ubuntu, the install script can install ffmpeg and eSpeak NG using apt.

```bash
./scripts/install.sh
```

### Run

Start the backend and frontend in separate terminals:

```bash
./scripts/dev-backend.sh
```

```bash
./scripts/dev-frontend.sh
```

Open the local URL printed by the frontend, then open **Settings** using the gear icon to save your GLM API key and download the speech models. Model downloads require internet access and several gigabytes of disk space.

### Linting

The frontend uses ESLint with TypeScript and React Hooks rules. Check its source, public scripts, configuration, and tests with:

```bash
npm run lint --prefix frontend
```

The local `frontend/lint` development package keeps ESLint's supported TypeScript parser runtime separate from the application's TypeScript compiler. The install script installs both packages. For a manual frontend installation, run `npm ci --prefix frontend` and `npm ci --prefix frontend/lint`.

The backend development dependencies include Ruff. Check Python lint rules and formatting with:

```bash
bash scripts/lint-backend.sh
```

To apply Python formatting, run `uv run --directory backend --extra dev --locked ruff format .`.
