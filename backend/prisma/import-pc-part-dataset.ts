import { createHash } from 'node:crypto';
import { PrismaClient, ComponentCategoryCode, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DATASET_BASE =
  'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json';

const DATASET_SOURCE = 'docyx/pc-part-dataset';
const DATASET_VERSION = 'main';

const IMPORTS: Array<{ file: string; category: ComponentCategoryCode; name: string }> = [
  { file: 'cpu.json', category: ComponentCategoryCode.CPU, name: 'Процессор' },
  { file: 'video-card.json', category: ComponentCategoryCode.GPU, name: 'Видеокарта' },
  { file: 'motherboard.json', category: ComponentCategoryCode.MOTHERBOARD, name: 'Материнская плата' },
  { file: 'memory.json', category: ComponentCategoryCode.RAM, name: 'Оперативная память' },
  { file: 'internal-hard-drive.json', category: ComponentCategoryCode.SSD, name: 'SSD / HDD' },
  { file: 'power-supply.json', category: ComponentCategoryCode.PSU, name: 'Блок питания' },
  { file: 'case.json', category: ComponentCategoryCode.CASE, name: 'Корпус' },
  { file: 'cpu-cooler.json', category: ComponentCategoryCode.COOLING, name: 'Охлаждение' },
];

type DatasetPart = Record<string, unknown> & { name?: string; price?: number | null };

const MANUFACTURERS = [
  'Thermaltake',
  'be quiet!',
  'Fractal Design',
  'Cooler Master',
  'PowerColor',
  'XFX',
  'Lian Li',
  'Kingston',
  'Crucial',
  'Western Digital',
  'Samsung',
  'Seagate',
  'TeamGroup',
  'G.Skill',
  'Silicon Power',
  'Patriot',
  'Corsair',
  'NZXT',
  'Deepcool',
  'DeepCool',
  'Thermalright',
  'Noctua',
  'Arctic',
  'Sapphire',
  'Gigabyte',
  'ASRock',
  'Asus',
  'ASUS',
  'MSI',
  'Zotac',
  'PNY',
  'Palit',
  'Gainward',
  'Inno3D',
  'EVGA',
  'Intel',
  'AMD',
  'NVIDIA',
  'BIOSTAR',
  'Antec',
  'Montech',
  'Phanteks',
  'Silverstone',
  'NZXT',
  'Aerocool',
  'Cougar',
  'Rosewill',
  'be quiet!',
].sort((a, b) => b.length - a.length);

function manufacturerAndModel(name: string) {
  const normalized = name.trim();

  for (const manufacturer of MANUFACTURERS) {
    if (normalized.toLowerCase().startsWith(manufacturer.toLowerCase() + ' ')) {
      return {
        manufacturer,
        model: normalized.slice(manufacturer.length).trim(),
      };
    }
  }

  const [first, ...rest] = normalized.split(/\s+/);
  return {
    manufacturer: first || 'Unknown',
    model: rest.join(' ') || normalized,
  };
}

function normalizeFormFactor(value: unknown) {
  if (typeof value !== 'string') return value;
  const normalized = value.toLowerCase().replace(/[-_]/g, ' ').trim();
  if (normalized === 'micro atx' || normalized === 'matx') return 'mATX';
  if (normalized === 'mini itx' || normalized === 'mitx') return 'ITX';
  if (normalized === 'extended atx' || normalized === 'e atx') return 'EATX';
  if (normalized === 'mini dtx') return 'Mini-DTX';
  if (normalized === 'atx') return 'ATX';
  return value;
}

function normalizeRamType(value: unknown) {
  if (Array.isArray(value) && typeof value[0] === 'number') {
    return `DDR${value[0]}`;
  }
  return undefined;
}

function compatibilityFor(category: ComponentCategoryCode, source: DatasetPart): Prisma.InputJsonValue | undefined {
  const result: Record<string, unknown> = {};

  if (category === ComponentCategoryCode.MOTHERBOARD) {
    if (typeof source.socket === 'string') result.socket = source.socket;
    const formFactor = normalizeFormFactor(source.form_factor);
    if (typeof formFactor === 'string') result.formFactor = formFactor;
  }

  if (category === ComponentCategoryCode.RAM) {
    const ramType = normalizeRamType(source.speed);
    if (ramType) result.ramType = ramType;
    if (Array.isArray(source.modules) && typeof source.modules[0] === 'number') {
      result.modules = source.modules[0];
    }
  }

  if (category === ComponentCategoryCode.GPU && typeof source.length === 'number') {
    result.lengthMm = source.length;
  }

  if (category === ComponentCategoryCode.PSU && typeof source.wattage === 'number') {
    result.powerW = source.wattage;
  }

  if (category === ComponentCategoryCode.CASE) {
    const formFactor = normalizeFormFactor(source.type);
    if (typeof formFactor === 'string') result.formFactor = formFactor;
  }

  return Object.keys(result).length ? result as Prisma.InputJsonValue : undefined;
}

function stableId(category: ComponentCategoryCode, name: string, index: number) {
  const digest = createHash('sha256')
    .update(`${DATASET_SOURCE}|${DATASET_VERSION}|${category}|${name}|${index}`)
    .digest('hex')
    .slice(0, 24);
  return `dataset-${digest}`;
}

function toSpecs(source: DatasetPart, category: ComponentCategoryCode, sourceUrl: string): Prisma.InputJsonValue {
  return {
    ...source,
    _dataset: {
      source: DATASET_SOURCE,
      version: DATASET_VERSION,
      category,
      sourceUrl,
    },
  } as Prisma.InputJsonValue;
}

async function loadDataset(file: string): Promise<DatasetPart[]> {
  const url = `${DATASET_BASE}/${file}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить ${url}: HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Файл ${file} имеет неожиданный формат: ожидался массив`);
  }

  return data.filter((item): item is DatasetPart => typeof item === 'object' && item !== null);
}

async function main() {
  console.log(`Импорт ${DATASET_SOURCE} из ${DATASET_BASE}`);
  console.log('Цена из dataset не переносится в Component.price: исходная цена сохраняется внутри specs как snapshot в USD.\n');

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const item of IMPORTS) {
    const category = await prisma.componentCategory.upsert({
      where: { code: item.category },
      update: { name: item.name },
      create: { code: item.category, name: item.name },
    });

    const rows = await loadDataset(item.file);
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const source = rows[index];
      const name = typeof source.name === 'string' ? source.name.trim() : '';

      if (!name || typeof source.price !== 'number' || !Number.isFinite(source.price) || source.price < 0) {
        skipped += 1;
        continue;
      }

      const { manufacturer, model } = manufacturerAndModel(name);
      const compatibility = compatibilityFor(item.category, source);
      const data = {
        categoryId: category.id,
        manufacturer,
        model,
        // Dataset contains a USD price snapshot, while Component.price is the\n        // application price. Do not import USD into the application's price field.\n        price: null,
        specs: toSpecs(source, item.category, `${DATASET_BASE}/${item.file}`),
        compatibility,
        inStock: true,
      };

      const id = stableId(item.category, name, index);
      const existing = await prisma.component.findUnique({ where: { id } });

      if (existing) {
        await prisma.component.update({ where: { id }, data });
        updated += 1;
      } else {
        await prisma.component.create({ data: { id, ...data } });
        created += 1;
      }
    }

    totalCreated += created;
    totalUpdated += updated;
    totalSkipped += skipped;

    console.log(
      `${item.category}: ${rows.length} записей → создано ${created}, обновлено ${updated}, пропущено ${skipped}`,
    );
  }

  console.log('\nИмпорт завершён.');
  console.log(`Создано: ${totalCreated}`);
  console.log(`Обновлено: ${totalUpdated}`);
  console.log(`Пропущено: ${totalSkipped}`);
}

main()
  .catch((error) => {
    console.error('Ошибка импорта:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
