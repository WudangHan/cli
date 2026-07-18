# Livrables — Semaine 1

**Volet** : Réactualisation du Protocole S4.2 (« signe zombie ») sur les LLM de nouvelle génération
**Phase Semaine 1** : *Cadrage & réamorçage* (cf. §7 du plan de travail)
**Chercheur** : Dr Sylvain Gagné · **Direction** : Prof. Dospinescu · **Université Laval**

## Objectifs de la Semaine 1 et couverture

| Objectif du plan (§7) | Livrable | Fichier |
|---|---|---|
| Reconduction des amorces | Corpus d'amorces canoniques (A/B/C) | `01_Corpus_amorces_S4.2.docx` · `amorces_source.md` |
| Fixation des cellules modèle × type | Plan des 48 cellules + matrice + paramètres | `02_Matrice_cellules_modele-type.xlsx` |
| Arborescence de stockage | Structure `[Système]/[Type]` + convention | `corpus/` · `corpus/README.md` |
| Gabarit `.json` | Modèle de métadonnées (reconduit du §11) | `gabarits/gabarit_metadonnees.json` |
| Tests de génération pilotes (1/modèle) | Pilote CO48 réel + stubs des 3 autres | `corpus/CO48/TypeA/…` · stubs `corpus/{CS5,GEM31,GLM52}/TypeA/` |
| Synthèse hebdomadaire | Note « Semaine 1 » | `00_Synthese_Semaine_1.docx` |

## Contenu du dossier

```
livrables/semaine-1/
├── 00_Synthese_Semaine_1.docx          ← bilan, livrables, avancées, obstacles, plan S2
├── 01_Corpus_amorces_S4.2.docx         ← amorces AM-A-01 / AM-B-01 / AM-C-01
├── 02_Matrice_cellules_modele-type.xlsx← 48 cellules · matrice 4×3 · paramètres canoniques
├── amorces_source.md                   ← source markdown des amorces
├── gabarits/
│   └── gabarit_metadonnees.json        ← gabarit .json reconduit (§11)
└── corpus/                             ← arborescence de stockage [Système]/[Type]
    ├── README.md
    ├── CO48/TypeA/  20260721_CO48_TypeA_001.{txt,json} + _grille_S4.2.md   ← pilote RÉEL
    ├── CS5/TypeA/   20260721_CS5_TypeA_001.json    (stub — à exécuter)
    ├── GEM31/TypeA/ 20260721_GEM31_TypeA_001.json  (stub — à exécuter)
    └── GLM52/TypeA/ 20260721_GLM52_TypeA_001.json  (stub — à exécuter)
```

## Note sur les pilotes

Le pilote **CO48** (Claude Opus 4.8) a été généré nativement — l'environnement de travail de la Semaine 1
est lui-même Opus 4.8 — puis scoré sur la grille S4.2 (résultat : 🟢 zombification faible, ~14 %), ce qui
valide le pipeline complet *amorce → génération → stockage → métadonnées → scorage*.

Les pilotes **CS5**, **GEM31** et **GLM52** ne peuvent être invoqués depuis cet environnement ; leurs fichiers
`.json` sont pré-remplis (amorce AM-A-01, paramètres canoniques cibles) et n'attendent que l'exécution sur la
plateforme du fournisseur puis le dépôt du `.txt`. Voir `00_Synthese_Semaine_1.docx` §4–5 pour le détail.

## Conformité ISO 42001

Traçabilité assurée : chaque production dispose de son `.json` de paramètres, tout écart au standard S4.2
(§6.2) est signalé comme variable de contrôle, et l'ensemble est versionné sous Git.
