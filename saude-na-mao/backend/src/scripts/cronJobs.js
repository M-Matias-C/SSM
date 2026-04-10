const cron = require("node-cron");
const prescriptionService = require("../services/prescriptionService");

function setupCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    try {
      const expiradas = await prescriptionService.expirePrescriptions();
      console.log(`[CRON] ${expiradas} receitas expiradas automaticamente`);
    } catch (error) {
      console.error("[CRON] Erro ao expirar receitas:", error.message);
    }
  });
}

module.exports = { setupCronJobs };
