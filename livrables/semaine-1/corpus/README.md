# Arborescence de stockage du corpus — Protocole S4.2

Structure reconduite du §11 : `[Système]/[Type]/[Date]`.

```
corpus/
├── CO48/    (Claude Opus 4.8 · Anthropic · 2026-05-28)
├── CS5/     (Claude Sonnet 5 · Anthropic · 2026-06-30)
├── GEM31/   (Gemini 3.1 Pro · Google · 2026)
└── GLM52/   (GLM-5.2 · Z.ai/Zhipu · 2026-06-13)
        └── TypeA/  TypeB/  TypeC/
```

## Convention de nommage

`[DATE]_[SYSTÈME]_[TYPE]_[NUMÉRO]` — ex. `20260721_CO48_TypeA_001`

- **DATE** : `AAAAMMJJ` · **SYSTÈME** : `CO48|CS5|GEM31|GLM52` · **TYPE** : `TypeA|TypeB|TypeC` · **NUMÉRO** : `001`–`004`.
- Chaque production = un trio de fichiers : `*.txt` (texte brut), `*.json` (métadonnées, cf. `gabarits/gabarit_metadonnees.json`), `*_grille_S4.2.md` (scorage, à partir de la Semaine 3).

## Dimensionnement cible (Semaines 2–3)

4 modèles × 3 types × 4 réplicats = **48 unités**.

## État Semaine 1 (pilotes — 1 par modèle)

| Modèle | Pilote Type A | État |
|--------|---------------|------|
| CO48   | `20260721_CO48_TypeA_001` | ✅ généré, métadonnées + grille S4.2 (🟢 ~14 %) |
| CS5    | `20260721_CS5_TypeA_001`  | ⏳ stub `.json` prêt — à exécuter sur plateforme Anthropic |
| GEM31  | `20260721_GEM31_TypeA_001`| ⏳ stub `.json` prêt — à exécuter sur plateforme Google |
| GLM52  | `20260721_GLM52_TypeA_001`| ⏳ stub `.json` prêt — à exécuter sur interface Z.ai |

> Le pilote CO48 a été produit nativement (l'environnement de travail Semaine 1 est lui-même Claude Opus 4.8).
> Les trois autres pilotes ne peuvent être générés depuis cet environnement : leurs `.json` sont pré-remplis
> (amorce AM-A-01, paramètres canoniques cibles) et n'attendent que l'exécution et le dépôt du `.txt`.
