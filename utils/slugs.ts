
import { Doctor } from '../types';

// SEO URL Helpers
export const toSlug = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export const createDoctorSlug = (doc: Doctor) => {
    // Format: dr-name-specialty-id
    return `${toSlug(doc.name)}-${toSlug(doc.specialty)}-${doc.id}`;
};
