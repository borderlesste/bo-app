module.exports = () => {
  const requiredVars = ['SESSION_SECRET', 'DB_HOST', 'NODE_ENV'];
  requiredVars.forEach((key) => {
    if (!process.env[key]) {
      console.error(`❌ Falta la variable de entorno: ${key}`);
      process.exit(1);
    }
  });
};
