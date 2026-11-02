export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    try {
        const { key, device_id } = req.body;

        if (!key || !device_id) {
            return res.json({ success: false, message: "Invalid Key or Device ID!" });
        }

        const firebaseUrl = `https://skymodsloader-default-rtdb.firebaseio.com/keys/${encodeURIComponent(key)}.json`;
        const response = await fetch(firebaseUrl);
        const keyData = await response.json();

        // 1. Key Exist Check
        if (!keyData) {
            return res.json({ success: false, message: "Invalid Key!" });
        }

        // 2. Expiry Check
        const now = new Date().getTime();
        const expiry = new Date(keyData.expires_at).getTime();
        if (now > expiry) {
            return res.json({ success: false, message: "Key Expired!" });
        }

        // 3. HWID / Device Binding Check
        let boundDevices = [];
        if (keyData.bound_devices) {
            if (Array.isArray(keyData.bound_devices)) {
                boundDevices = keyData.bound_devices;
            } else if (typeof keyData.bound_devices === 'string' && keyData.bound_devices.trim() !== '') {
                boundDevices = [keyData.bound_devices];
            }
        }

        const maxDev = keyData.max_devices === "Unlimited" ? 999999 : parseInt(keyData.max_devices) || 1;

        if (!boundDevices.includes(device_id)) {
            if (boundDevices.length >= maxDev) {
                return res.json({ success: false, message: "Max devices reached!" });
            }

            boundDevices.push(device_id);
            await fetch(firebaseUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bound_devices: boundDevices })
            });
        }

        // 4. Success Response
        return res.json({
            success: true,
            key_type: keyData.key_type || "mod_menu",
            message: "Success"
        });

    } catch (err) {
        return res.json({ success: false, message: "Server error: " + err.message });
    }
}
