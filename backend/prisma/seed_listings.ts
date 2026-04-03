import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/greenery?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import Decimal = Prisma.Decimal;

const sellers = [
  "seller1@greenery.com",
  "seller2@greenery.com",
  "seller3@greenery.com",
  "seller4@greenery.com",
];

const images = [
  "https://images.unsplash.com/photo-1536859355448-76f92eb7a41c?auto=format&fit=crop&q=80&w=800", // Flower
  "https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&q=80&w=800", // Joints
  "https://images.unsplash.com/photo-1589133182607-0639f7a70104?auto=format&fit=crop&q=80&w=800", // Growing
  "https://images.unsplash.com/photo-1628102422619-ec8464654955?auto=format&fit=crop&q=80&w=800", // Oil
  "https://images.unsplash.com/photo-1616593437254-8e42095cc606?auto=format&fit=crop&q=80&w=800", // Vape
  "https://images.unsplash.com/photo-1594468119234-22748a3950aa?auto=format&fit=crop&q=80&w=800", // Edibles
];

const rawData = [
  // Table 1
  { name: "Weed", desc: "Common cannabis term", flavor: "Earthy", type: "Hybrid", strain: "Mixed", thc: "10–25%", cbd: "<1%" },
  { name: "Pot", desc: "Classic slang", flavor: "Herbal", type: "Hybrid", strain: "Mixed", thc: "10–20%", cbd: "<1%" },
  { name: "Ganja", desc: "Cultural term", flavor: "Spicy", type: "Indica", strain: "Landrace", thc: "12–22%", cbd: "<1%" },
  { name: "Herb", desc: "Natural cannabis", flavor: "Pine", type: "Hybrid", strain: "Mixed", thc: "10–20%", cbd: "<1%" },
  { name: "Grass", desc: "Old-school slang", flavor: "Fresh", type: "Sativa", strain: "Mixed", thc: "8–18%", cbd: "<1%" },
  { name: "Mary Jane", desc: "Popular nickname", flavor: "Sweet", type: "Hybrid", strain: "Mixed", thc: "10–20%", cbd: "<1%" },
  { name: "Bud", desc: "Cannabis flower", flavor: "Citrus", type: "Hybrid", strain: "Any", thc: "15–30%", cbd: "<1%" },
  { name: "Green", desc: "Color-based slang", flavor: "Herbal", type: "Hybrid", strain: "Any", thc: "10–20%", cbd: "<1%" },
  { name: "Trees", desc: "High quality weed", flavor: "Pine", type: "Sativa", strain: "Premium", thc: "18–28%", cbd: "<1%" },
  { name: "Broccoli", desc: "Visual slang", flavor: "Fresh", type: "Hybrid", strain: "Mid-grade", thc: "8–18%", cbd: "<1%" },
  { name: "Cabbage", desc: "Humor slang", flavor: "Earthy", type: "Hybrid", strain: "Low-mid", thc: "8–15%", cbd: "<1%" },
  { name: "Kush", desc: "Premium indica", flavor: "Earthy", type: "Indica", strain: "Kush", thc: "18–28%", cbd: "<1%" },
  { name: "Dank", desc: "Strong cannabis", flavor: "Diesel", type: "Hybrid", strain: "Premium", thc: "20–30%", cbd: "<1%" },
  { name: "Loud", desc: "High potency", flavor: "Skunk", type: "Hybrid", strain: "High THC", thc: "20–30%", cbd: "<1%" },
  { name: "Gas", desc: "Fuel aroma weed", flavor: "Diesel", type: "Hybrid", strain: "Modern", thc: "20–30%", cbd: "<1%" },
  { name: "Chronic", desc: "High-grade weed", flavor: "Pungent", type: "Hybrid", strain: "Premium", thc: "20–30%", cbd: "<1%" },
  { name: "Reefer", desc: "Vintage slang", flavor: "Earthy", type: "Hybrid", strain: "Old", thc: "5–15%", cbd: "<1%" },
  { name: "Dope", desc: "General slang", flavor: "Skunky", type: "Hybrid", strain: "Mixed", thc: "12–22%", cbd: "<1%" },
  { name: "Flower", desc: "Dispensary term", flavor: "Floral", type: "Hybrid", strain: "Any", thc: "15–30%", cbd: "<1%" },
  { name: "Blaze", desc: "Smoking slang", flavor: "Herbal", type: "Hybrid", strain: "Any", thc: "18%", cbd: "<1%" },
  // Table 2
  { name: "Skunk", desc: "Strong odor strain", flavor: "Skunky", type: "Hybrid", strain: "Skunk", thc: "15–25%", cbd: "<1%" },
  { name: "Haze", desc: "Uplifting strain", flavor: "Citrus", type: "Sativa", strain: "Haze", thc: "16–24%", cbd: "<1%" },
  { name: "Diesel", desc: "Fuel aroma strain", flavor: "Diesel", type: "Sativa", strain: "Diesel", thc: "18–26%", cbd: "<1%" },
  { name: "OG", desc: "Classic lineage", flavor: "Earthy", type: "Hybrid", strain: "OG", thc: "18–26%", cbd: "<1%" },
  { name: "Purple", desc: "Color-based strain", flavor: "Berry", type: "Indica", strain: "Purple", thc: "16–22%", cbd: "<1%" },
  { name: "Blue Dream", desc: "Balanced hybrid", flavor: "Berry", type: "Hybrid", strain: "Blue Dream", thc: "17–24%", cbd: "<1%" },
  { name: "Sour Diesel", desc: "Energizing", flavor: "Diesel", type: "Sativa", strain: "Sour Diesel", thc: "20–26%", cbd: "<1%" },
  { name: "Gorilla Glue", desc: "Heavy strain", flavor: "Chocolate", type: "Hybrid", strain: "GG4", thc: "20–30%", cbd: "<1%" },
  { name: "Pineapple Express", desc: "Tropical", flavor: "Pineapple", type: "Hybrid", strain: "PE", thc: "18–25%", cbd: "<1%" },
  { name: "Gelato", desc: "Dessert strain", flavor: "Sweet", type: "Hybrid", strain: "Gelato", thc: "20–28%", cbd: "<1%" },
  { name: "Zkittlez", desc: "Candy-like strain", flavor: "Fruity", type: "Indica", strain: "Zkittlez", thc: "18–24%", cbd: "<1%" },
  { name: "Cookies", desc: "Dessert strain", flavor: "Sweet", type: "Hybrid", strain: "GSC", thc: "20–28%", cbd: "<1%" },
  { name: "Wedding Cake", desc: "Rich strain", flavor: "Vanilla", type: "Indica", strain: "Wedding Cake", thc: "20–27%", cbd: "<1%" },
  { name: "Ice Cream Cake", desc: "Creamy strain", flavor: "Creamy", type: "Indica", strain: "ICC", thc: "20–25%", cbd: "<1%" },
  { name: "Banana Kush", desc: "Fruity strain", flavor: "Banana", type: "Indica", strain: "BK", thc: "18–25%", cbd: "<1%" },
  { name: "Mango Kush", desc: "Tropical strain", flavor: "Mango", type: "Indica", strain: "MK", thc: "16–22%", cbd: "<1%" },
  { name: "Lemon Haze", desc: "Citrus strain", flavor: "Lemon", type: "Sativa", strain: "LH", thc: "18–25%", cbd: "<1%" },
  { name: "Strawberry Cough", desc: "Fruity strain", flavor: "Strawberry", type: "Sativa", strain: "SC", thc: "18–24%", cbd: "<1%" },
  { name: "Jack Herer", desc: "Classic strain", flavor: "Pine", type: "Sativa", strain: "JH", thc: "18–24%", cbd: "<1%" },
  { name: "White Widow", desc: "Balanced classic", flavor: "Earthy", type: "Hybrid", strain: "WW", thc: "18–25%", cbd: "<1%" },
  // Table 3
  { name: "AK-47", desc: "Strong hybrid", flavor: "Earthy", type: "Hybrid", strain: "AK-47", thc: "18–24%", cbd: "<1%" },
  { name: "Northern Lights", desc: "Relaxing strain", flavor: "Sweet", type: "Indica", strain: "NL", thc: "16–22%", cbd: "<1%" },
  { name: "Durban Poison", desc: "Pure sativa", flavor: "Sweet", type: "Sativa", strain: "DP", thc: "18–26%", cbd: "<1%" },
  { name: "Amnesia Haze", desc: "Strong sativa", flavor: "Citrus", type: "Sativa", strain: "AH", thc: "20–25%", cbd: "<1%" },
  { name: "Granddaddy Purple", desc: "Sedative strain", flavor: "Grape", type: "Indica", strain: "GDP", thc: "17–23%", cbd: "<1%" },
  { name: "Bubba Kush", desc: "Heavy indica", flavor: "Coffee", type: "Indica", strain: "BK", thc: "18–25%", cbd: "<1%" },
  { name: "Tahoe OG", desc: "Relaxing", flavor: "Lemon", type: "Indica", strain: "OG", thc: "20–25%", cbd: "<1%" },
  { name: "Skywalker OG", desc: "Balanced", flavor: "Herbal", type: "Hybrid", strain: "OG", thc: "20–26%", cbd: "<1%" },
  { name: "Trainwreck", desc: "Potent hybrid", flavor: "Pine", type: "Hybrid", strain: "TW", thc: "18–25%", cbd: "<1%" },
  { name: "Super Silver Haze", desc: "Energetic", flavor: "Citrus", type: "Sativa", strain: "SSH", thc: "18–23%", cbd: "<1%" },
  { name: "Purple Haze", desc: "Classic", flavor: "Berry", type: "Sativa", strain: "PH", thc: "16–22%", cbd: "<1%" },
  { name: "Maui Wowie", desc: "Tropical", flavor: "Pineapple", type: "Sativa", strain: "MW", thc: "15–20%", cbd: "<1%" },
  { name: "Hawaiian", desc: "Island strain", flavor: "Tropical", type: "Sativa", strain: "HW", thc: "15–20%", cbd: "<1%" },
  { name: "Afghan Kush", desc: "Pure indica", flavor: "Earthy", type: "Indica", strain: "AK", thc: "17–22%", cbd: "<1%" },
  { name: "Hindu Kush", desc: "Landrace", flavor: "Earthy", type: "Indica", strain: "HK", thc: "16–22%", cbd: "<1%" },
  { name: "Thai Stick", desc: "Classic", flavor: "Herbal", type: "Sativa", strain: "Thai", thc: "10–18%", cbd: "<1%" },
  { name: "Panama Red", desc: "Old-school", flavor: "Sweet", type: "Sativa", strain: "PR", thc: "10–16%", cbd: "<1%" },
  { name: "Colombian Gold", desc: "Classic", flavor: "Citrus", type: "Sativa", strain: "CG", thc: "12–18%", cbd: "<1%" },
  { name: "Acapulco Gold", desc: "Premium classic", flavor: "Sweet", type: "Sativa", strain: "AG", thc: "18–24%", cbd: "<1%" },
  { name: "Chocolate Thai", desc: "Unique strain", flavor: "Chocolate", type: "Sativa", strain: "CT", thc: "12–20%", cbd: "<1%" },
  // Table 4
  { name: "Cheese", desc: "Funky strain", flavor: "Cheese", type: "Hybrid", strain: "Cheese", thc: "16–22%", cbd: "<1%" },
  { name: "Blue Cheese", desc: "Creamy strain", flavor: "Berry", type: "Indica", strain: "BC", thc: "18–23%", cbd: "<1%" },
  { name: "Critical Mass", desc: "Heavy yield", flavor: "Sweet", type: "Indica", strain: "CM", thc: "18–22%", cbd: "<1%" },
  { name: "OG Kush", desc: "Iconic strain", flavor: "Earthy", type: "Hybrid", strain: "OG", thc: "20–26%", cbd: "<1%" },
  { name: "Sunset Sherbet", desc: "Fruity", flavor: "Citrus", type: "Hybrid", strain: "SS", thc: "18–24%", cbd: "<1%" },
  { name: "Runtz", desc: "Candy strain", flavor: "Fruity", type: "Hybrid", strain: "Runtz", thc: "20–28%", cbd: "<1%" },
  { name: "Animal Cookies", desc: "Potent", flavor: "Sweet", type: "Hybrid", strain: "AC", thc: "23–30%", cbd: "<1%" },
  { name: "MAC (Miracle Alien Cookies)", desc: "Premium", flavor: "Creamy", type: "Hybrid", strain: "MAC", thc: "20–27%", cbd: "<1%" },
  { name: "Slurricane", desc: "Relaxing", flavor: "Berry", type: "Indica", strain: "SL", thc: "20–28%", cbd: "<1%" },
  { name: "Do-Si-Dos", desc: "Balanced", flavor: "Sweet", type: "Hybrid", strain: "DSD", thc: "20–28%", cbd: "<1%" },
  { name: "Forbidden Fruit", desc: "Fruity", flavor: "Citrus", type: "Indica", strain: "FF", thc: "18–26%", cbd: "<1%" },
  { name: "Papaya", desc: "Tropical", flavor: "Papaya", type: "Indica", strain: "Papaya", thc: "18–25%", cbd: "<1%" },
  { name: "Guava", desc: "Exotic", flavor: "Guava", type: "Hybrid", strain: "Guava", thc: "18–25%", cbd: "<1%" },
  { name: "Apple Fritter", desc: "Dessert", flavor: "Apple", type: "Hybrid", strain: "AF", thc: "22–28%", cbd: "<1%" },
  { name: "Cherry Pie", desc: "Sweet strain", flavor: "Cherry", type: "Hybrid", strain: "CP", thc: "16–24%", cbd: "<1%" },
  { name: "Peach Ringz", desc: "Candy strain", flavor: "Peach", type: "Hybrid", strain: "PR", thc: "20–26%", cbd: "<1%" },
  { name: "Watermelon", desc: "Fruity", flavor: "Watermelon", type: "Indica", strain: "WM", thc: "18–25%", cbd: "<1%" },
  { name: "Grape Ape", desc: "Relaxing", flavor: "Grape", type: "Indica", strain: "GA", thc: "18–23%", cbd: "<1%" },
  { name: "Blackberry Kush", desc: "Berry strain", flavor: "Blackberry", type: "Indica", strain: "BK", thc: "18–24%", cbd: "<1%" },
  { name: "Lemon Tree", desc: "Citrus", flavor: "Lemon", type: "Hybrid", strain: "LT", thc: "18–25%", cbd: "<1%" },
  // Table 5
  { name: "Orange Bud", desc: "Citrus strain", flavor: "Orange", type: "Hybrid", strain: "OB", thc: "16–22%", cbd: "<1%" },
  { name: "Tangie", desc: "Orange strain", flavor: "Tangerine", type: "Sativa", strain: "Tangie", thc: "18–25%", cbd: "<1%" },
  { name: "Mimosa", desc: "Uplifting", flavor: "Citrus", type: "Hybrid", strain: "Mimosa", thc: "20–27%", cbd: "<1%" },
  { name: "Clementine", desc: "Sweet citrus", flavor: "Citrus", type: "Sativa", strain: "Clementine", thc: "18–24%", cbd: "<1%" },
  { name: "Pineapple Kush", desc: "Tropical", flavor: "Pineapple", type: "Hybrid", strain: "PK", thc: "18–24%", cbd: "<1%" },
  { name: "Citrus Punch", desc: "Fruity", flavor: "Citrus", type: "Hybrid", strain: "CP", thc: "20–26%", cbd: "<1%" },
  { name: "Tropicana Cookies", desc: "Exotic", flavor: "Orange", type: "Hybrid", strain: "TC", thc: "20–28%", cbd: "<1%" },
  { name: "Blood Orange", desc: "Citrus strain", flavor: "Orange", type: "Hybrid", strain: "BO", thc: "18–25%", cbd: "<1%" },
  { name: "Sunset OG", desc: "Relaxing", flavor: "Earthy", type: "Indica", strain: "OG", thc: "20–26%", cbd: "<1%" },
  { name: "Fire OG", desc: "Strong OG", flavor: "Diesel", type: "Indica", strain: "OG", thc: "20–28%", cbd: "<1%" },
  { name: "King Louis XIII", desc: "Heavy indica", flavor: "Pine", type: "Indica", strain: "KL", thc: "20–27%", cbd: "<1%" },
  { name: "Death Star", desc: "Potent", flavor: "Diesel", type: "Indica", strain: "DS", thc: "20–27%", cbd: "<1%" },
  { name: "Bruce Banner", desc: "Strong hybrid", flavor: "Sweet", type: "Hybrid", strain: "BB", thc: "24–30%", cbd: "<1%" },
  { name: "Hulkberry", desc: "Energetic", flavor: "Berry", type: "Sativa", strain: "HB", thc: "20–28%", cbd: "<1%" },
  { name: "Green Crack", desc: "Energetic", flavor: "Citrus", type: "Sativa", strain: "GC", thc: "18–25%", cbd: "<1%" },
  { name: "Chem Dawg", desc: "Diesel strain", flavor: "Diesel", type: "Hybrid", strain: "CD", thc: "20–27%", cbd: "<1%" },
  { name: "Sour OG", desc: "Balanced", flavor: "Diesel", type: "Hybrid", strain: "OG", thc: "20–26%", cbd: "<1%" },
  { name: "Platinum OG", desc: "Premium", flavor: "Earthy", type: "Indica", strain: "OG", thc: "20–26%", cbd: "<1%" },
  { name: "Diamond OG", desc: "Potent", flavor: "Pine", type: "Indica", strain: "OG", thc: "20–27%", cbd: "<1%" },
  { name: "Space Queen", desc: "Uplifting", flavor: "Fruity", type: "Hybrid", strain: "SQ", thc: "18–24%", cbd: "<1%" },
];

function parseRange(rangeStr: string): number {
  if (!rangeStr) return 0;
  const match = rangeStr.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0;
}

async function main() {
  console.log("Starting listing seed...");

  const userEmails = await prisma.user.findMany({
    where: { email: { in: sellers } },
    select: { id: true, email: true },
  });

  if (userEmails.length === 0) {
    throw new Error("No sellers found. Please ensure seller1@greenery.com through seller4@greenery.com exist.");
  }

  const sellerMap = new Map(userEmails.map((u) => [u.email, u.id]));

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const sellerIndex = Math.floor(i / 25);
    const sellerEmail = sellers[sellerIndex];
    const sellerId = sellerMap.get(sellerEmail);

    if (!sellerId) {
      console.warn(`Seller ${sellerEmail} not found, skipping item ${item.name}`);
      continue;
    }

    const imageIndex = i % images.length;
    const price = new Decimal((Math.random() * (150 - 50) + 50).toFixed(2));

    await prisma.listing.create({
      data: {
        sellerId,
        title: item.name,
        description: `${item.desc}. This premium ${item.strain} strain features key notes of ${item.flavor}. Hand-trimmed and cured to perfection.`,
        price,
        imageUrl: images[imageIndex],
        active: true,
        status: "ACTIVE",
        deliveryAvailable: Math.random() > 0.5,
        minQuantity: 1,
        strainType: item.type, // e.g. Indica, Sativa, Hybrid
        type: "Flower", // Majority of this list is flower
        flavors: item.flavor,
        thcContent: parseRange(item.thc),
        cbdContent: parseRange(item.cbd),
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} listings...`);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
