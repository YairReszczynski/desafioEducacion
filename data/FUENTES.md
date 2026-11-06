# Fuentes de datos — Desafío 2 (deserción educación superior)

Todos los archivos bajo `data/` provienen de **fuentes oficiales abiertas**. No hay datos inventados.

## Fuentes oficiales usadas

| Fuente | Qué aporta | URL |
|--------|------------|-----|
| **SIES / Mi Futuro (Mineduc)** | Informes y tablas de **retención de 1er año** de pregrado (tasas oficiales) | https://www.mifuturo.cl/informes-retencion-de-primer-ano/ |
| **SIES / Mi Futuro** | Bases de **matrícula** y **titulados** | https://www.mifuturo.cl/bases-de-datos-de-matriculados/ · https://www.mifuturo.cl/bases-de-datos-titulados/ |
| **Datos Abiertos Mineduc** | Matrícula ES con identificador anonimizado `mrun` (estudiante) | https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/ |
| **Portal datos.gob.cl** | Catálogo que apunta a los mismos recursos Mineduc | https://datos.gob.cl/dataset/matricula-en-educacion-superior |
| **CNED – INDICES** | Visualizaciones de retención y bases institucionales (descarga web a veces bloqueada) | https://cned.cl/indices/retencion-primer-ano/ · https://cned.cl/institucional/bases-de-datos/ |

## Cómo citar (obligatorio)

- Tasas / informes SIES: *Servicio de Información de Educación Superior (SIES), Ministerio de Educación — www.mifuturo.cl*
- Cruces propios: *Elaboración propia a partir de base publicada en www.mifuturo.cl / datosabiertos.mineduc.cl*

## Archivos en este repo

### Listos para análisis (`data/processed/`)

| Archivo | Contenido | Origen |
|---------|-----------|--------|
| `retencion_1er_ano_por_tipo_ies_sies.csv` | Retención 1er año 2007–2025 por CFT / IP / Universidad | `Informe_Retencion_SIES_2026.xlsx` |
| `retencion_1er_ano_por_sexo_sies.csv` | Retención por sexo | idem |
| `retencion_1er_ano_por_origen_secundaria_sies.csv` | Retención por dependencia del colegio de origen | idem |
| `retencion_1er_ano_ies_seleccionadas_sies.csv` | Retención UC, Duoc UC, U. de Chile, INACAP, etc. | idem |
| `resumen_retencion_sies.json` | Snapshot numérico para el pitch | derivado |
| `matricula_primer_anio_pregrado_2025_sies.csv` (+ `.gz`) | **420.276** registros reales de 1er año pregrado 2025 (anonimizados) | Matrícula Ed. Superior 2025 MRUN |
| `resumen_matricula_primer_anio_2025.json` | Conteos por jornada, región, IES, etc. | derivado |

### Crudos (`data/raw/`)

- `Informe_Retencion_SIES_2026.xlsx` / `_2025.xlsx` — Excel oficial SIES
- `Informe_Retencion_1er_Ano_Pregrado_2026.pdf` — informe PDF
- `Glosario_Matricula_SIES.pdf` — definición de variables
- `Titulados_2025_SIES.xlsx` — titulados 2025
- `Matricula_*` zip/rar — paquetes oficiales (algunos >20 MB)
- `matricula_extracted/...2025...MRUN.csv` — base completa 2025 (~988 MB, ~1,45 M filas)

### Documentación (`data/docs/`)

PDFs de glosario, informe de retención y diccionario ER de matrícula.

## Hallazgos oficiales útiles para el desafío (cohorte / datos 2025)

**Retención 1er año (SIES, última cohorte en Excel 2026 = 2025):**

| Tipo institución | Retención | No retención ≈ |
|------------------|-----------|----------------|
| Total ES | 77,9% | 22,1% |
| Universidades | 84,7% | 15,3% |
| IP | 72,5% | 27,5% |
| CFT | 69,9% | 30,1% |

- Mujeres 79,4% vs hombres 76,1% de retención.
- Origen colegio particular pagado 85,7% vs público 75,7%.
- Ejemplos IES: **PUC 89,7%**, **Duoc UC (IP) 78,0%**.

**Matrícula 1er año pregrado 2025 (base abierta MRUN):** 420.276 estudiantes.  
Vespertina 80.285 · A distancia 70.640 · Diurna 261.470.  
Top ingreso: IP Duoc UC (38.752), IP AIEP, CFT INACAP, etc.

> Nota metodológica: “no retención en la misma IES/cohorte” **no es idéntico** a abandonar todo el sistema de ES (existe persistencia en otra institución). Usar las tres tasas SIES (retención, persistencia en IES, persistencia en ES) en el pitch.

## Limitación ética (bases)

La base abierta de matrícula **no incluye** notas, asistencia LMS ni pagos. Para el prototipo de alerta individual hay que:

1. Usar estos datos oficiales para **calibrar riesgo agregado** (jornada, tipo IES, edad, región, etc.), y/o  
2. Generar un **dataset sintético documentado** alineado a estas distribuciones reales (permitido por las bases del hackathon), sin inventar cifras oficiales.

## Descargas directas (por si hay que re-bajar)

```text
https://www.mifuturo.cl/wp-content/uploads/2026/09/Informe_Retencion_SIES_2026_270702026.xlsx
https://mifuturo.cl/wp-content/uploads/2025/08/Informe_Retencion_SIES_2025.xlsx
https://www.mifuturo.cl/wp-content/uploads/2026/07/Matricula_2026_WEB_10_07_2026.zip
https://www.mifuturo.cl/wp-content/uploads/2026/07/Matricula_2007_2026_WEB_10_07_2026.zip
https://datosabiertos.mineduc.cl/wp-content/uploads/2026/09/Matricula-Ed-Superior-2025.rar
https://www.mifuturo.cl/wp-content/uploads/2026/05/TITULADO_2025_web_27_05_2026_E.xlsx
```
