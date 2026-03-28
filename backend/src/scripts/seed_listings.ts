import { prisma } from "../utils/prisma";
import dotenv from "dotenv";
import { ListingStatus, Role, UserStatus } from "@prisma/client";

dotenv.config();

const SELLER_EMAIL = "seller@greenery.com";

async function main() {
  console.log("Finding seller...");
  let seller = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
  });

  if (!seller) {
    console.log(`Seller ${SELLER_EMAIL} not found. Creating...`);
    seller = await prisma.user.create({
      data: {
        email: SELLER_EMAIL,
        password: "$2b$10$YourHashedPasswordHere", // Dummy password
        name: "Premium Seller",
        role: Role.SELLER,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
    });

    // Create seller profile too
    await prisma.sellerProfile.create({
      data: {
        userId: seller.id,
        latitude: 1.3521,
        longitude: 103.8198,
        address: "123 Green Lane, Eco City",
        description: "Top quality greenery and related products.",
      },
    });

    console.log(`Created seller with ID: ${seller.id}`);
  } else {
    console.log(`Found seller with ID: ${seller.id}`);
  }

  const listingsData = [
    {
      title: "Purple Haze Premium",
      description:
        "A legendary sativa-dominant hybrid with a sweet, earthy profile. Perfect for creativity and focus.",
      price: 45.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Sweet, Berry, Earthy",
      effects: "Creative, Energetic, Uplifting",
      thcContent: 22.5,
      cbdContent: 0.1,
      sku: "PH-001",
    },
    {
      title: "Granddaddy Purple",
      description:
        "Famous indica cross between Purple Urkle and Big Bud. Deeply relaxing and great for pain relief.",
      price: 50.0,
      strainType: "Indica",
      type: "Flower",
      flavors: "Grape, Berry, Floral",
      effects: "Relaxed, Sleepy, Hungry",
      thcContent: 19.0,
      cbdContent: 1.2,
      sku: "GDP-002",
    },
    {
      title: "Blue Dream Select",
      description:
        "A sativa-leaning hybrid that balances full-body relaxation with gentle cerebral invigoration.",
      price: 40.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Blueberry, Pine, Sweet",
      effects: "Happy, Euphoric, Calm",
      thcContent: 18.5,
      cbdContent: 2.0,
      sku: "BD-003",
    },
    {
      title: "Sour Diesel Premium",
      description:
        "An invigorating sativa-dominant strain named after its pungent, diesel-like aroma.",
      price: 55.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Diesel, Pungent, Citrus",
      effects: "Dreamy, Cerebral, Fast-acting",
      thcContent: 25.0,
      cbdContent: 0.05,
      sku: "SD-004",
    },
    {
      title: "Northern Lights classic",
      description:
        "One of the most famous indica strains of all time, prized for its resinous buds and resilience.",
      price: 48.0,
      strainType: "Indica",
      type: "Flower",
      flavors: "Pungent, Pine, Earthy",
      effects: "Happy, Relaxed, Euphoric",
      thcContent: 16.0,
      cbdContent: 0.1,
      sku: "NL-005",
    },
    {
      title: "OG Kush OG",
      description:
        "The foundation of many West Coast cannabis varieties. Complex aroma with notes of fuel and skunk.",
      price: 52.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Skunk, Diesel, Spice",
      effects: "Relaxed, Happy, Euphoric",
      thcContent: 20.0,
      cbdContent: 0.3,
      sku: "OGK-006",
    },
    {
      title: "Girl Scout Cookies (GSC)",
      description:
        "A cross of OG Kush and Durban Poison. Known for producing euphoria followed by full-body relaxation.",
      price: 60.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Sweet, Pungent, Minty",
      effects: "Happy, Euphoric, Relaxed",
      thcContent: 26.0,
      cbdContent: 1.0,
      sku: "GSC-007",
    },
    {
      title: "White Widow Extreme",
      description:
        "A balanced hybrid first bred in the Netherlands. Known for its heavy coating of white trichomes.",
      price: 45.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Earthy, Wood, Pungent",
      effects: "Energetic, Happy, Euphoric",
      thcContent: 20.0,
      cbdContent: 0.5,
      sku: "WW-008",
    },
    {
      title: "Jack Herer Premium",
      description:
        "Named after the famous cannabis activist. Provides a clear-headed, creative high.",
      price: 42.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Pine, Woody, Spicy",
      effects: "Creative, Energetic, Uplifting",
      thcContent: 18.0,
      cbdContent: 0.2,
      sku: "JH-009",
    },
    {
      title: "Wedding Cake",
      description:
        "Indica-leaning hybrid cross between Cherry Pie and Girl Scout Cookies. Rich, tangy flavor.",
      price: 58.0,
      strainType: "Indica",
      type: "Flower",
      flavors: "Vanilla, Sweet, Peppery",
      effects: "Relaxed, Happy, Euphoric",
      thcContent: 24.0,
      cbdContent: 0.1,
      sku: "WC-010",
    },
    {
      title: "Pineapple Express",
      description:
        "Combines the potent and flavorful forces of parent strains Trainwreck and Hawaiian.",
      price: 44.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Pineapple, Tropical, Citrus",
      effects: "Energetic, Happy, Uplifting",
      thcContent: 21.0,
      cbdContent: 0.1,
      sku: "PE-011",
    },
    {
      title: "Sherbet Honey Oil",
      description:
        "High potency concentrate derived from the Sherbet strain. Smooth and flavorful.",
      price: 75.0,
      strainType: "Hybrid",
      type: "Concentrates",
      flavors: "Berry, Sweet, Citrus",
      effects: "Relaxed, Happy, Euphoric",
      thcContent: 85.0,
      cbdContent: 2.0,
      sku: "SHO-012",
    },
    {
      title: "Gorilla Glue #4",
      description:
        'Known for its heavy-handed euphoria and relaxation. Leaves you feeling "glued" to the couch.',
      price: 54.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Pungent, Pine, Earthy",
      effects: "Euphoric, Relaxed, Sleepy",
      thcContent: 27.0,
      cbdContent: 0.0,
      sku: "GG4-013",
    },
    {
      title: "Strawberry Cough",
      description:
        "Known for its sweet smell of fresh strawberries and an expanding sensation that can make even the most seasoned consumer cough.",
      price: 47.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Strawberry, Berry, Sweet",
      effects: "Energetic, Happy, Uplifting",
      thcContent: 23.0,
      cbdContent: 0.1,
      sku: "SC-014",
    },
    {
      title: "Amnesia Haze",
      description:
        "With earthy flavors of lemons and citrus, Amnesia Haze is the perfect sativa strain to start your day with a smile.",
      price: 43.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Lemon, Citrus, Earthy",
      effects: "Energetic, Euphoric, Happy",
      thcContent: 21.0,
      cbdContent: 0.3,
      sku: "AH-015",
    },
    {
      title: "Bubba Kush",
      description:
        "An indica strain that has gained notoriety in the US and beyond for its heavy tranquilizing effects.",
      price: 49.0,
      strainType: "Indica",
      type: "Flower",
      flavors: "Sweet, Pungent, Coffee",
      effects: "Relaxed, Sleepy, Hungry",
      thcContent: 17.0,
      cbdContent: 0.5,
      sku: "BK-016",
    },
    {
      title: "AK-47",
      description:
        "Don't let its name fool you: AK-47 will leave you relaxed and mellow.",
      price: 41.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Earthy, Pungent, Woody",
      effects: "Happy, Relaxed, Uplifting",
      thcContent: 20.0,
      cbdContent: 0.1,
      sku: "AK-017",
    },
    {
      title: "Durban Poison",
      description:
        "This pure sativa is originating from the South African port city of Durban.",
      price: 46.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Pine, Sweet, Citrus",
      effects: "Energetic, Uplifting, Creative",
      thcContent: 20.0,
      cbdContent: 0.1,
      sku: "DP-018",
    },
    {
      title: "Super Lemon Haze",
      description:
        "A kief-caked multi-colored wonder. As the name states, this strain has real lemony characteristics.",
      price: 45.0,
      strainType: "Sativa",
      type: "Flower",
      flavors: "Lemon, Citrus, Sweet",
      effects: "Energetic, Happy, Uplifting",
      thcContent: 22.0,
      cbdContent: 0.0,
      sku: "SLH-019",
    },
    {
      title: "Chemdawg",
      description:
        "Chemdawg has developed quite the name for itself over the years. Between its mysterious origin, ambiguous genetics, and the plethora of successful crosses the strain has produced.",
      price: 53.0,
      strainType: "Hybrid",
      type: "Flower",
      flavors: "Diesel, Pungent, Earthy",
      effects: "Euphoric, Happy, Relaxed",
      thcContent: 24.0,
      cbdContent: 0.1,
      sku: "CD-020",
    },
  ];

  console.log(`Creating 20 listings for seller ${seller.id}...`);

  for (const item of listingsData) {
    await prisma.listing.create({
      data: {
        ...item,
        sellerId: seller.id,
        imageUrl: `https://picsum.photos/seed/${item.sku}/800/600`, // Using dummy images for now or I can generate them
        status: ListingStatus.ACTIVE,
        deliveryAvailable: true,
        minQuantity: 1,
      },
    });
  }

  console.log("Successfully created 20 dummy listings!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
