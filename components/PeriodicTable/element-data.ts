export interface PeriodicElement {
  readonly Z: number
  readonly symbol: string
  readonly name: string
  readonly row: number
  readonly col: number
  readonly category: string
}

export const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  'alkali-metal': 'bg-red-900/60',
  'alkaline-earth': 'bg-orange-900/60',
  'transition-metal': 'bg-yellow-900/40',
  'post-transition': 'bg-green-900/40',
  'metalloid': 'bg-teal-900/40',
  'nonmetal': 'bg-blue-900/40',
  'halogen': 'bg-cyan-900/40',
  'noble-gas': 'bg-purple-900/40',
  'lanthanide': 'bg-pink-900/40',
  'actinide': 'bg-rose-900/40',
} as const

export const PERIODIC_LAYOUT: readonly PeriodicElement[] = [
  // Row 1
  { Z: 1, symbol: 'H', name: 'Hydrogen', row: 1, col: 1, category: 'nonmetal' },
  { Z: 2, symbol: 'He', name: 'Helium', row: 1, col: 18, category: 'noble-gas' },

  // Row 2
  { Z: 3, symbol: 'Li', name: 'Lithium', row: 2, col: 1, category: 'alkali-metal' },
  { Z: 4, symbol: 'Be', name: 'Beryllium', row: 2, col: 2, category: 'alkaline-earth' },
  { Z: 5, symbol: 'B', name: 'Boron', row: 2, col: 13, category: 'metalloid' },
  { Z: 6, symbol: 'C', name: 'Carbon', row: 2, col: 14, category: 'nonmetal' },
  { Z: 7, symbol: 'N', name: 'Nitrogen', row: 2, col: 15, category: 'nonmetal' },
  { Z: 8, symbol: 'O', name: 'Oxygen', row: 2, col: 16, category: 'nonmetal' },
  { Z: 9, symbol: 'F', name: 'Fluorine', row: 2, col: 17, category: 'halogen' },
  { Z: 10, symbol: 'Ne', name: 'Neon', row: 2, col: 18, category: 'noble-gas' },

  // Row 3
  { Z: 11, symbol: 'Na', name: 'Sodium', row: 3, col: 1, category: 'alkali-metal' },
  { Z: 12, symbol: 'Mg', name: 'Magnesium', row: 3, col: 2, category: 'alkaline-earth' },
  { Z: 13, symbol: 'Al', name: 'Aluminium', row: 3, col: 13, category: 'post-transition' },
  { Z: 14, symbol: 'Si', name: 'Silicon', row: 3, col: 14, category: 'metalloid' },
  { Z: 15, symbol: 'P', name: 'Phosphorus', row: 3, col: 15, category: 'nonmetal' },
  { Z: 16, symbol: 'S', name: 'Sulfur', row: 3, col: 16, category: 'nonmetal' },
  { Z: 17, symbol: 'Cl', name: 'Chlorine', row: 3, col: 17, category: 'halogen' },
  { Z: 18, symbol: 'Ar', name: 'Argon', row: 3, col: 18, category: 'noble-gas' },

  // Row 4
  { Z: 19, symbol: 'K', name: 'Potassium', row: 4, col: 1, category: 'alkali-metal' },
  { Z: 20, symbol: 'Ca', name: 'Calcium', row: 4, col: 2, category: 'alkaline-earth' },
  { Z: 21, symbol: 'Sc', name: 'Scandium', row: 4, col: 3, category: 'transition-metal' },
  { Z: 22, symbol: 'Ti', name: 'Titanium', row: 4, col: 4, category: 'transition-metal' },
  { Z: 23, symbol: 'V', name: 'Vanadium', row: 4, col: 5, category: 'transition-metal' },
  { Z: 24, symbol: 'Cr', name: 'Chromium', row: 4, col: 6, category: 'transition-metal' },
  { Z: 25, symbol: 'Mn', name: 'Manganese', row: 4, col: 7, category: 'transition-metal' },
  { Z: 26, symbol: 'Fe', name: 'Iron', row: 4, col: 8, category: 'transition-metal' },
  { Z: 27, symbol: 'Co', name: 'Cobalt', row: 4, col: 9, category: 'transition-metal' },
  { Z: 28, symbol: 'Ni', name: 'Nickel', row: 4, col: 10, category: 'transition-metal' },
  { Z: 29, symbol: 'Cu', name: 'Copper', row: 4, col: 11, category: 'transition-metal' },
  { Z: 30, symbol: 'Zn', name: 'Zinc', row: 4, col: 12, category: 'transition-metal' },
  { Z: 31, symbol: 'Ga', name: 'Gallium', row: 4, col: 13, category: 'post-transition' },
  { Z: 32, symbol: 'Ge', name: 'Germanium', row: 4, col: 14, category: 'metalloid' },
  { Z: 33, symbol: 'As', name: 'Arsenic', row: 4, col: 15, category: 'metalloid' },
  { Z: 34, symbol: 'Se', name: 'Selenium', row: 4, col: 16, category: 'nonmetal' },
  { Z: 35, symbol: 'Br', name: 'Bromine', row: 4, col: 17, category: 'halogen' },
  { Z: 36, symbol: 'Kr', name: 'Krypton', row: 4, col: 18, category: 'noble-gas' },

  // Row 5
  { Z: 37, symbol: 'Rb', name: 'Rubidium', row: 5, col: 1, category: 'alkali-metal' },
  { Z: 38, symbol: 'Sr', name: 'Strontium', row: 5, col: 2, category: 'alkaline-earth' },
  { Z: 39, symbol: 'Y', name: 'Yttrium', row: 5, col: 3, category: 'transition-metal' },
  { Z: 40, symbol: 'Zr', name: 'Zirconium', row: 5, col: 4, category: 'transition-metal' },
  { Z: 41, symbol: 'Nb', name: 'Niobium', row: 5, col: 5, category: 'transition-metal' },
  { Z: 42, symbol: 'Mo', name: 'Molybdenum', row: 5, col: 6, category: 'transition-metal' },
  { Z: 43, symbol: 'Tc', name: 'Technetium', row: 5, col: 7, category: 'transition-metal' },
  { Z: 44, symbol: 'Ru', name: 'Ruthenium', row: 5, col: 8, category: 'transition-metal' },
  { Z: 45, symbol: 'Rh', name: 'Rhodium', row: 5, col: 9, category: 'transition-metal' },
  { Z: 46, symbol: 'Pd', name: 'Palladium', row: 5, col: 10, category: 'transition-metal' },
  { Z: 47, symbol: 'Ag', name: 'Silver', row: 5, col: 11, category: 'transition-metal' },
  { Z: 48, symbol: 'Cd', name: 'Cadmium', row: 5, col: 12, category: 'transition-metal' },
  { Z: 49, symbol: 'In', name: 'Indium', row: 5, col: 13, category: 'post-transition' },
  { Z: 50, symbol: 'Sn', name: 'Tin', row: 5, col: 14, category: 'post-transition' },
  { Z: 51, symbol: 'Sb', name: 'Antimony', row: 5, col: 15, category: 'metalloid' },
  { Z: 52, symbol: 'Te', name: 'Tellurium', row: 5, col: 16, category: 'metalloid' },
  { Z: 53, symbol: 'I', name: 'Iodine', row: 5, col: 17, category: 'halogen' },
  { Z: 54, symbol: 'Xe', name: 'Xenon', row: 5, col: 18, category: 'noble-gas' },

  // Row 6 (main row — La in col 3, lanthanides in row 8)
  { Z: 55, symbol: 'Cs', name: 'Caesium', row: 6, col: 1, category: 'alkali-metal' },
  { Z: 56, symbol: 'Ba', name: 'Barium', row: 6, col: 2, category: 'alkaline-earth' },
  { Z: 57, symbol: 'La', name: 'Lanthanum', row: 6, col: 3, category: 'lanthanide' },
  { Z: 72, symbol: 'Hf', name: 'Hafnium', row: 6, col: 4, category: 'transition-metal' },
  { Z: 73, symbol: 'Ta', name: 'Tantalum', row: 6, col: 5, category: 'transition-metal' },
  { Z: 74, symbol: 'W', name: 'Tungsten', row: 6, col: 6, category: 'transition-metal' },
  { Z: 75, symbol: 'Re', name: 'Rhenium', row: 6, col: 7, category: 'transition-metal' },
  { Z: 76, symbol: 'Os', name: 'Osmium', row: 6, col: 8, category: 'transition-metal' },
  { Z: 77, symbol: 'Ir', name: 'Iridium', row: 6, col: 9, category: 'transition-metal' },
  { Z: 78, symbol: 'Pt', name: 'Platinum', row: 6, col: 10, category: 'transition-metal' },
  { Z: 79, symbol: 'Au', name: 'Gold', row: 6, col: 11, category: 'transition-metal' },
  { Z: 80, symbol: 'Hg', name: 'Mercury', row: 6, col: 12, category: 'transition-metal' },
  { Z: 81, symbol: 'Tl', name: 'Thallium', row: 6, col: 13, category: 'post-transition' },
  { Z: 82, symbol: 'Pb', name: 'Lead', row: 6, col: 14, category: 'post-transition' },
  { Z: 83, symbol: 'Bi', name: 'Bismuth', row: 6, col: 15, category: 'post-transition' },
  { Z: 84, symbol: 'Po', name: 'Polonium', row: 6, col: 16, category: 'post-transition' },
  { Z: 85, symbol: 'At', name: 'Astatine', row: 6, col: 17, category: 'halogen' },
  { Z: 86, symbol: 'Rn', name: 'Radon', row: 6, col: 18, category: 'noble-gas' },

  // Row 7 (main row — Ac in col 3, actinides in row 9)
  { Z: 87, symbol: 'Fr', name: 'Francium', row: 7, col: 1, category: 'alkali-metal' },
  { Z: 88, symbol: 'Ra', name: 'Radium', row: 7, col: 2, category: 'alkaline-earth' },
  { Z: 89, symbol: 'Ac', name: 'Actinium', row: 7, col: 3, category: 'actinide' },

  // Row 8: Lanthanides (Ce=58 through Lu=71, cols 4-17)
  { Z: 58, symbol: 'Ce', name: 'Cerium', row: 8, col: 4, category: 'lanthanide' },
  { Z: 59, symbol: 'Pr', name: 'Praseodymium', row: 8, col: 5, category: 'lanthanide' },
  { Z: 60, symbol: 'Nd', name: 'Neodymium', row: 8, col: 6, category: 'lanthanide' },
  { Z: 61, symbol: 'Pm', name: 'Promethium', row: 8, col: 7, category: 'lanthanide' },
  { Z: 62, symbol: 'Sm', name: 'Samarium', row: 8, col: 8, category: 'lanthanide' },
  { Z: 63, symbol: 'Eu', name: 'Europium', row: 8, col: 9, category: 'lanthanide' },
  { Z: 64, symbol: 'Gd', name: 'Gadolinium', row: 8, col: 10, category: 'lanthanide' },
  { Z: 65, symbol: 'Tb', name: 'Terbium', row: 8, col: 11, category: 'lanthanide' },
  { Z: 66, symbol: 'Dy', name: 'Dysprosium', row: 8, col: 12, category: 'lanthanide' },
  { Z: 67, symbol: 'Ho', name: 'Holmium', row: 8, col: 13, category: 'lanthanide' },
  { Z: 68, symbol: 'Er', name: 'Erbium', row: 8, col: 14, category: 'lanthanide' },
  { Z: 69, symbol: 'Tm', name: 'Thulium', row: 8, col: 15, category: 'lanthanide' },
  { Z: 70, symbol: 'Yb', name: 'Ytterbium', row: 8, col: 16, category: 'lanthanide' },
  { Z: 71, symbol: 'Lu', name: 'Lutetium', row: 8, col: 17, category: 'lanthanide' },

  // Row 9: Actinides (Th=90 through Cf=98, cols 4-12)
  { Z: 90, symbol: 'Th', name: 'Thorium', row: 9, col: 4, category: 'actinide' },
  { Z: 91, symbol: 'Pa', name: 'Protactinium', row: 9, col: 5, category: 'actinide' },
  { Z: 92, symbol: 'U', name: 'Uranium', row: 9, col: 6, category: 'actinide' },
  { Z: 93, symbol: 'Np', name: 'Neptunium', row: 9, col: 7, category: 'actinide' },
  { Z: 94, symbol: 'Pu', name: 'Plutonium', row: 9, col: 8, category: 'actinide' },
  { Z: 95, symbol: 'Am', name: 'Americium', row: 9, col: 9, category: 'actinide' },
  { Z: 96, symbol: 'Cm', name: 'Curium', row: 9, col: 10, category: 'actinide' },
  { Z: 97, symbol: 'Bk', name: 'Berkelium', row: 9, col: 11, category: 'actinide' },
  { Z: 98, symbol: 'Cf', name: 'Californium', row: 9, col: 12, category: 'actinide' },
] as const
