// Тип фукнции apiFetch
type ApiFetch = (input: string, init?: RequestInit) => Promise<any>;
// Тип юнита
interface Unit {
  id: number;
  name: string;
  card_id: number;
  health: number;
  power: number;
  wood: number;
  stone: number;
  meleeSpeed: number;
  isRange: number; 
  range: number | null;
  attackCooldown: number;
  image_url: string;
}
// Каорта
interface Card {
  id: number;
  user_id: number;
  card_id: number;
  quantity: number;
  name: string;
  description: string | null;
  type: string;
  rarity: number;
  wood: number;
  stone: number;
  power: number | null;
  health: number | null;
  image_url: string;
}
// Колода
interface CardHolder {
  id: number;
  name: string;
  card_id1: number;
  card_id2: number;
  card_id3: number;
  user_id: number;
}
// Получение коллекций пользователя
export async function getCollections(
  cards: { value: any[] },
  apiFetch: ApiFetch
): Promise<void> {
  try {
    const id = localStorage.getItem("DeckID");
    const response = await apiFetch('http://localhost:3000/api/getPlayerTotalDecs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const response2 = await apiFetch('http://localhost:3000/api/getPlayerCollections', {
      method: 'POST',
      body: JSON.stringify({ id: localStorage.getItem('auth') }),
    });
    cards.value=getCardsByIds(response,response2);
  } catch (error) {
    console.error('Ошибка при получении коллекций:', error);
  }
}

// Получение способностей юнитов по коллекции
export async function getUnits(
  cards: { value: any[] },
  units: { value: any[] },
  apiFetch: ApiFetch
): Promise<void> {
  try {
    const current = cards.value ?? [];
    const responses = await Promise.all(
      current.map(card =>
        apiFetch('http://localhost:3000/api/getUnit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card: card.id })
        })
      )
    );
    units.value = responses;
  } catch (error) {
    console.error('Ошибка при получении юнитов:', error);
  }
}

//всех данных для игры
export async function getFiles(
  arr: { value: any[] },
  apiFetch: ApiFetch
): Promise<void> {
  try {
    let responses= await apiFetch('http://localhost:3000/api/allFiles', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    arr.value = responses.map((elem:String)=>{
      return {key:elem.split(".")[0],url:"http://localhost:3000/images/"+elem}
    });
  } catch (error) {
    console.error('Ошибка при получении файлов:', error);
  }
}

// Получение способностей юнитов по коллекции
export async function getUnitAbilities(
  cards: { value: any[] },
  apiFetch: ApiFetch
): Promise<void> {
  try {
    const current = cards.value ?? [];
    const responses = await Promise.all(
      current.map(cardGroup =>
        Promise.all(
          cardGroup.map((inCard: any) =>
            apiFetch('http://localhost:3000/api/getUnitAbilities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ card: inCard.id })
            })
          )
        )
      )
    );
    const unitsWithAbilities = current.map((cardGroup, groupIndex) => {
      const abilitiesGroup = responses[groupIndex];
      return cardGroup.map((unit:Unit, unitIndex:number) => {
        const unitAbilities = abilitiesGroup[unitIndex];
        if (unitAbilities === false) {
          return {
            ...unit,
            abilities: []
          };
        }
        if (Array.isArray(unitAbilities)) {
          const cleanAbilities = unitAbilities.map(ability => ({
            ability_id: ability.ability_id,
            name: ability.name,
            slug: ability.slug,
            description: ability.description,
            type: ability.type,
            duration: ability.duration,
            damage_per_tick: ability.damage_per_tick,
            apply_chance: ability.apply_chance,
            cooldown: ability.cooldown,
            target: ability.target,
            color: ability.color,
            icon_path: ability.icon_path
          }));
          return {
            ...unit,
            abilities: cleanAbilities
          };
        }
        return {
          ...unit,
          abilities: []
        };
      });
    });
    cards.value = unitsWithAbilities;
  } catch (error) {
    console.error('Ошибка при получении способностей юнитов:', error);
  }
}
function getCardsByIds(obj: CardHolder, allCards: Card[]): Card[] {
  const { card_id1, card_id2, card_id3 } = (obj as any)[0];
  const idsToFind = [card_id1, card_id2, card_id3];
  return allCards.filter(card => idsToFind.includes(card.card_id));
}