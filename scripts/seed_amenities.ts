
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const amenities = [
    {
        name: 'Quincho',
        description: 'Zona de asados equipada',
        capacity: 20,
        photo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
    },
    {
        name: 'Sala de Eventos',
        description: 'Sala multiuso para celebraciones',
        capacity: 50,
        photo_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1798&q=80'
    },
    {
        name: 'Piscina',
        description: 'Piscina al aire libre',
        capacity: 15,
        photo_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
    }
];

async function seedAmenities() {
    console.log('Seeding amenities...');

    // Check if amenities exist
    const { data: existing, error: checkError } = await supabase.from('amenities').select('*');

    if (checkError) {
        console.error('Error checking amenities:', checkError);
        return;
    }

    if (existing && existing.length > 0) {
        console.log('Amenities already exist:', existing.length);
        return;
    }

    const { data, error } = await supabase.from('amenities').insert(amenities).select();

    if (error) {
        console.error('Error inserting amenities:', error);
    } else {
        console.log('Amenities inserted successfully:', data?.length);
    }
}

seedAmenities();
