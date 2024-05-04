const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    "default_db",
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: '147.45.151.112',
        port: '5432',
        dialect: 'postgres'
    }
)