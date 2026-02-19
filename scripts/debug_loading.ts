import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { dataService } from '../services/data';
import { supabase } from '../lib/supabase';

async function main() {
    console.log("Starting debug check...");

    // Test Amenities
    try {
        console.log("Fetching Amenities...");
        const amenities = await dataService.getAmenities();
        console.log(`Amenities success: Found ${amenities.length} items.`);
        if (amenities.length > 0) console.log("First amenity:", amenities[0]);
    } catch (e: any) {
        console.error("Amenities FAILED:", e.message);
        console.error("Full Error:", e);
    }

    // Test Reservations
    try {
        console.log("\nFetching Reservations...");
        const reservations = await dataService.getReservations();
        console.log(`Reservations success: Found ${reservations.length} items.`);
        if (reservations.length > 0) console.log("First reservation:", reservations[0]);
    } catch (e: any) {
        console.error("Reservations FAILED:", e.message);
        console.error("Full Error:", e);
    }
}

main().catch(console.error);
