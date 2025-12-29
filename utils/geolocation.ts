
export const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Address Helper - UPDATED to return City and Postcode for auto-selection
export const reverseGeocode = async (lat: number, lng: number) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || '';
            const pincode = addr.postcode || '';
            return { 
                address: street ? `${street}, ${city}` : city, 
                city: city,
                pincode: pincode
            };
        }
        return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', pincode: '' };
    } catch (e) {
        return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', pincode: '' };
    }
};
