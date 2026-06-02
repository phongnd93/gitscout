import app from '../api/index';

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` GitScout Opportunity Scouter running on port ${PORT}`);
    console.log(`====================================================`);
  });
}

export default app;