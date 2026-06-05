import cron from 'node-cron';
import app, { performFullScan } from '../api/index';

const PORT = process.env.PORT || 3001;

// Schedule cron job: scan every 4 hours (at minute 0 of every 4th hour)
cron.schedule('0 */4 * * *', async () => {
  console.log(`[CRON] Triggering scheduled full scan at ${new Date().toISOString()}`);
  try {
    const result = await performFullScan();
    console.log(`[CRON] Scan completed: ${result.totalProcessed} repos, ${result.totalErrors} errors`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CRON] Scan failed: ${message}`);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Saigon'
});

console.log('⏰ Cron job scheduled: scan every 4 hours (Asia/Saigon timezone)');

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` GitScout Opportunity Scouter running on port ${PORT}`);
    console.log(`====================================================`);
  });
}

export default app;