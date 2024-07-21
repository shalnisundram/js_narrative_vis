import os
import json 

groups = {
    "Energy": [
        "Crude Petroleum","Refined Petroleum","Petroleum Gas","Coal Briquettes",
        "Electricity","Sulfate Chemical Woodpulp","Aluminium Oxide"
    ], 
    "Minerals and Metals": [
        "Gold","Copper Ore","Refined Copper","Iron Ore","Diamonds",
        "Titanium Ore","Raw Aluminium","Scrap Iron","Ferroalloys","Iron Blocks","Raw Copper",
        "Raw Aluminium","Sawn Wood","Aluminium Oxide","Potassic Fertilizers","Rough Wood"
    ],
    "Crops and Livestock": [
        "Soybeans","Corn", "Tea","Raw Tobacco","Raw Cotton","Soybean Meal","Vanilla",
        "Cocoa Beans","Bananas","Palm Oil","Pure Olive Oil","Coconuts Brazil Nuts and Cashews",
        "Tropical Fruits","Other Vegetables","Raw Sugar","Molluscs","Other Animals",
        "Rolled Tobacco","Cloves","Animal Meal and Pellets"
    ],
    "Manufactured": [
        "Broadcasting Equipment","Cars","Planes, Helicopters, and/or Spacecraft",
        "Office Machine Parts","Packaged Medicaments","Medical Instruments","Insulated Wire",
        "Non-Knit Men's Suits","House Linens","Knit Sweaters","Knit T-shirts","Vehicle Parts",
        "Special Purpose Ships","Passenger and Cargo Ships","Processed Fish","Recreational Boats",
        "Laboratory Glassware","Plastic Building Materials","Washing and Bottling Machines",
        "Reaction and Catalytic Products","Processed Crustaceans","Washing and Bottling Machines","Oscilloscopes",
        "Medical Instruments","Low-voltage Protection Equipment","Integrated Circuits",
        "Integrated Circuits","Watch Movements","Planes Helicopters and/or Spacecraft"
    ],
    "Food and Beverages": [
        "Coffee","Processed Fish","Fish Fillets","Non-fillet Frozen Fish",
        "Non-fillet Fresh Fish","Sand","Hard Liquor","Concentrated Milk"
    ],
    "Luxury Items": [
        "Gold","Diamonds","Pearls"
    ],
    "Miscellaneous": [
        None,"Blood, antisera, vaccines, toxins, and cultures","Water","Leather Footwear","None"
    ]
}
fp = open("/Users/shalniundram/Documents/UIUC/Academics/Summer2024Semester!/CS_416/js_narrative_vis/data/exports-by-country-2024.json")
json_data = json.load(fp)

switched_dict = {}

# for quick lookup
for x, y in groups.items():
    for product in y:
        switched_dict[product] = x

for i in json_data:
    exportsByCountry_mainExport2019 = i["exportsByCountry_mainExport2019"]
    i['group'] = switched_dict.get(exportsByCountry_mainExport2019, "Unclassified")

with open("/Users/shalnisundram/Documents/UIUC/Academics/Summer2024Semester!/CS_416/js_narrative_vis/data/exports-by-country-2024.json", 'w') as fp:
    json.dump(json_data, fp, indent=4)