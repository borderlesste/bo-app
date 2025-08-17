const { pool } = require('../config/db');

class Configuracion {
    static async get() {
        const [result] = await pool.execute('SELECT * FROM configuracion WHERE id = 1');
        return result[0] || null;
    }

    static async update(configData) {
        const existingConfig = await this.get();
        
        if (!existingConfig) {
            const fields = Object.keys(configData).join(', ');
            const placeholders = Object.keys(configData).map(() => '?').join(', ');
            const values = Object.values(configData);
            
            await pool.execute(`INSERT INTO configuracion (${fields}) VALUES (${placeholders})`, values);
        } else {
            const fields = [];
            const values = [];
            
            Object.keys(configData).forEach(key => {
                if (configData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(configData[key]);
                }
            });
            
            if (fields.length > 0) {
                await pool.execute(`UPDATE configuracion SET ${fields.join(', ')} WHERE id = 1`, values);
            }
        }
        
        return await this.get();
    }

    static async getCompanyInfo() {
        const config = await this.get();
        if (!config) return null;

        return {
            company_name: config.company_name,
            company_description: config.company_description,
            company_slogan: config.company_slogan,
            company_email: config.company_email,
            company_phone: config.company_phone,
            company_whatsapp: config.company_whatsapp,
            company_address: config.company_address,
            company_website: config.company_website,
            company_logo: config.company_logo,
            company_favicon: config.company_favicon,
            company_rfc: config.company_rfc,
            company_regimen_fiscal: config.company_regimen_fiscal
        };
    }

    static async getThemeSettings() {
        const config = await this.get();
        if (!config) return null;

        return {
            theme_mode: config.theme_mode,
            theme_primary_color: config.theme_primary_color,
            theme_secondary_color: config.theme_secondary_color,
            theme_compact_mode: config.theme_compact_mode,
            theme_animations: config.theme_animations
        };
    }

    static async getSecuritySettings() {
        const config = await this.get();
        if (!config) return null;

        return {
            password_min_length: config.password_min_length,
            password_require_uppercase: config.password_require_uppercase,
            password_require_lowercase: config.password_require_lowercase,
            password_require_numbers: config.password_require_numbers,
            password_require_symbols: config.password_require_symbols,
            password_expiration_days: config.password_expiration_days,
            password_history_count: config.password_history_count,
            login_max_attempts: config.login_max_attempts,
            login_lockout_minutes: config.login_lockout_minutes,
            session_timeout_minutes: config.session_timeout_minutes,
            session_max_concurrent: config.session_max_concurrent,
            two_factor_enabled: config.two_factor_enabled,
            ip_whitelist: config.ip_whitelist,
            ip_blacklist: config.ip_blacklist
        };
    }

    static async updateCompanyInfo(companyData) {
        return await this.update(companyData);
    }

    static async updateThemeSettings(themeData) {
        return await this.update(themeData);
    }

    static async updateSecuritySettings(securityData) {
        return await this.update(securityData);
    }

    static async getBusinessSettings() {
        const config = await this.get();
        if (!config) return null;

        return {
            company_timezone: config.company_timezone,
            company_language: config.company_language,
            company_currency: config.company_currency,
            business_hours: config.business_hours,
            auto_response_enabled: config.auto_response_enabled,
            auto_response_message: config.auto_response_message,
            maintenance_mode: config.maintenance_mode,
            maintenance_message: config.maintenance_message
        };
    }
}

module.exports = Configuracion;