export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(200).json({ success: false, message: "Method Not Allowed" });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        body = body || {};

        const key = body.key ? body.key.trim() : null;
        const device_id = body.device_id ? body.device_id.trim() : null;

        if (!key) {
            return res.status(200).json({ success: false, message: "Enter Key First!" });
        }

        // नया Firebase Database
        const firebaseUrl = `https://sara-e4b8a-default-rtdb.firebaseio.com/keys/${key}.json`;
        const fbRes = await fetch(firebaseUrl);
        const keyData = await fbRes.json();

        if (!keyData || keyData.error) {
            return res.status(200).json({ success: false, message: "Invalid Key!" });
        }

        if (keyData.status === "blocked") {
            return res.status(200).json({ success: false, message: "Key Blocked by Admin!" });
        }

        const now = Date.now();
        const expiry = new Date(keyData.expires_at).getTime();
        if (isNaN(expiry) || expiry <= now) {
            return res.status(200).json({ success: false, message: "Key Expired!" });
        }

        // Device HWID Binding
        let boundDevices = [];
        if (keyData.bound_devices) {
            if (typeof keyData.bound_devices === 'string') {
                boundDevices = keyData.bound_devices.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(keyData.bound_devices)) {
                boundDevices = keyData.bound_devices.map(s => String(s).trim()).filter(Boolean);
            }
        }

        const maxDev = keyData.max_devices === "Unlimited" ? 99999 : (parseInt(keyData.max_devices) || 1);

        if (device_id) {
            if (!boundDevices.includes(device_id)) {
                if (boundDevices.length >= maxDev) {
                    return res.status(200).json({ success: false, message: "Device Limit Exceeded!" });
                }
                boundDevices.push(device_id);
                
                await fetch(firebaseUrl, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bound_devices: boundDevices.join(',') })
                });
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: "Login Successful", 
            expires_at: keyData.expires_at 
        });

    } catch (err) {
        return res.status(200).json({ success: false, message: "Server error: " + err.message });
    }
}
