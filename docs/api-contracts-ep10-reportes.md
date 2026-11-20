# Contrato FE · EP10 Reportes y analítica

## H20 · Ingresos y renovación

- `GET /api/reports/financial?startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>`
- Las dos fechas son obligatorias.
- La pantalla acepta el contrato propuesto
  `{ period, totalIncome, paymentCount, renewals, renewalRate }`.
- También normaliza el contrato observado en la API de pruebas:
  `{ totalRevenue, renovationRate }`.
- Los campos no presentes se muestran como «No informado» y nunca se calculan.

## H21 · Ocupación de clases

- `GET /api/reports/occupancy?startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>&classId=<id>`
- `startDate` y `endDate` son obligatorios; `classId` es opcional.
- La API de pruebas puede devolver `{ className, occupancyPercentage }`.
- También se tolera el contrato propuesto con `date`, `startTime`, `maxCapacity`,
  `reservedCount`, `availableSpots` y `occupancyRate`.
- Los campos ausentes se representan con «—» y no se deducen ni se inventan.
