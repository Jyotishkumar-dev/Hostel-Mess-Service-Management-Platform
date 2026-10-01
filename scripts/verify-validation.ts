/**
 * Checks the complaint form schema against the cases in the Phase 3 brief.
 *
 * Run with: npx tsx scripts/verify-validation.ts
 */
import { complaintSchema } from "@/lib/validations/complaint";
import { validateImage } from "@/lib/validations/image";
import { categoriesForArea, isCategoryForArea } from "@/types/complaint";

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
    fail += 1;
  }
}

const valid = {
  serviceType: "hostel",
  category: "water",
  title: "Water cooler not working",
  description: "The drinking water cooler near Block B has not worked since yesterday.",
  location: "Block B, 3rd Floor",
};

console.log("### Form schema");
check("valid hostel complaint passes", complaintSchema.safeParse(valid).success);

check(
  "valid mess complaint passes",
  complaintSchema.safeParse({
    ...valid,
    serviceType: "mess",
    category: "food_quality",
    location: "Main Mess",
  }).success,
);

check(
  "empty title is rejected",
  !complaintSchema.safeParse({ ...valid, title: "" }).success,
);
check(
  "whitespace-only title is rejected",
  !complaintSchema.safeParse({ ...valid, title: "   " }).success,
);
check(
  "very short title is rejected",
  !complaintSchema.safeParse({ ...valid, title: "abc" }).success,
);
check(
  "over-long title is rejected",
  !complaintSchema.safeParse({ ...valid, title: "x".repeat(121) }).success,
);
check(
  "empty description is rejected",
  !complaintSchema.safeParse({ ...valid, description: "" }).success,
);
check(
  "too-short description is rejected",
  !complaintSchema.safeParse({ ...valid, description: "broken" }).success,
);
check(
  "over-long description is rejected",
  !complaintSchema.safeParse({ ...valid, description: "x".repeat(2001) }).success,
);
check(
  "empty location is rejected",
  !complaintSchema.safeParse({ ...valid, location: "" }).success,
);
check(
  "unknown category is rejected",
  !complaintSchema.safeParse({ ...valid, category: "not_a_category" }).success,
);
check(
  "mess category on a hostel complaint is rejected",
  !complaintSchema.safeParse({ ...valid, category: "taste" }).success,
);
check(
  "hostel category on a mess complaint is rejected",
  !complaintSchema.safeParse({ ...valid, serviceType: "mess", category: "water" }).success,
);
check(
  "'other' is accepted for both service types",
  complaintSchema.safeParse({ ...valid, category: "other" }).success &&
    complaintSchema.safeParse({ ...valid, serviceType: "mess", category: "other" }).success,
);

console.log("");
console.log("### Category model");
check("hostel exposes 11 categories", categoriesForArea("hostel").length === 11);
check("mess exposes 10 categories", categoriesForArea("mess").length === 10);
check(
  "every hostel category is hostel-valid",
  categoriesForArea("hostel").every((c) => isCategoryForArea("hostel", c)),
);
check(
  "no mess category leaks into hostel",
  !categoriesForArea("mess")
    .filter((c) => c !== "other")
    .some((c) => isCategoryForArea("hostel", c)),
);

console.log("");
console.log("### Image validation");
const file = (type: string, size: number) => ({ type, size, name: "photo.jpg" });
check("jpg accepted", validateImage(file("image/jpeg", 1024)).ok);
check("png accepted", validateImage(file("image/png", 1024)).ok);
check("webp accepted", validateImage(file("image/webp", 1024)).ok);
check(
  "5 MB file accepted",
  validateImage(file("image/jpeg", 5 * 1024 * 1024)).ok,
);
check(
  "over 5 MB rejected",
  !validateImage(file("image/jpeg", 5 * 1024 * 1024 + 1)).ok,
);
check("pdf rejected", !validateImage(file("application/pdf", 1024)).ok);
check("svg rejected", !validateImage(file("image/svg+xml", 1024)).ok);
check("empty file rejected", !validateImage(file("image/jpeg", 0)).ok);

console.log("");
console.log("-------------------------------------");
console.log(`passed: ${pass}   failed: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
