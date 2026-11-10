import quran from '../data/quran.json';

export const CONTENT_VERSION = quran.version;
export interface IslamicReference {
  id: string;
  label: string;
  url: string;
  grade: string;
}
export const references: Record<string, IslamicReference> = {};
function ref(id: string, label: string, grade = 'Sahih (collection)') {
  references[id] = { id, label, grade, url: `https://sunnah.com/${id}` };
  return id;
}
const r = {
  kursi: ref('bukhari:2311', 'Sahih al-Bukhari 2311'),
  three: ref('abudawud:5082', 'Sunan Abi Dawud 5082', 'Hasan (Al-Albani)'),
  sleep: ref('bukhari:5017', 'Sahih al-Bukhari 5017'),
  forgiveness: ref('bukhari:6306', 'Sahih al-Bukhari 6306'),
  protection: ref('abudawud:5088', 'Sunan Abi Dawud 5088', 'Sahih (Al-Albani)'),
  pleased: ref(
    'tirmidhi:3389',
    'Jami at-Tirmidhi 3389',
    'Hasan gharib (at-Tirmidhi); related chains differ',
  ),
  pleasedWeak: ref('abudawud:5072', 'Sunan Abi Dawud 5072', 'Da’if (Al-Albani)'),
  refuge: ref(
    'tirmidhi:3604b',
    'Jami at-Tirmidhi 3604b',
    'Sahih (Darussalam); Hasan (at-Tirmidhi)',
  ),
  hundred: ref('muslim:2692', 'Sahih Muslim 2692'),
  peace: ref('muslim:591', 'Sahih Muslim 591'),
  prayer: ref('abudawud:1523', 'Sunan Abi Dawud 1523', 'Sahih (Al-Albani)'),
  tasbih: ref('muslim:597a', 'Sahih Muslim 597a'),
  alternative: ref('muslim:596a', 'Sahih Muslim 596a'),
  night: ref('bukhari:5009', 'Sahih al-Bukhari 5009'),
  bedtime: ref('muslim:2727a', 'Sahih Muslim 2727a'),
  mulk: ref('tirmidhi:2891', 'Jami at-Tirmidhi 2891', 'Hasan (Darussalam)'),
  home: ref('muslim:780', 'Sahih Muslim 780'),
  fatihah: ref('bukhari:756', 'Sahih al-Bukhari 756'),
};
export interface TrackerRecitation {
  id: string;
  type: 'surah' | 'ayah' | 'dua' | 'dhikr';
  title: string;
  titleMl: string;
  arabic: string;
  surahNumber?: number;
  ayahStart?: number;
  ayahEnd?: number;
  verses?: { key: string; text: string }[];
  transliteration?: { en: string; ml: string };
  translation?: { en: string; ml: string };
  references: string[];
  note?: string;
  review: string;
}
const items: TrackerRecitation[] = [];
function Quran(
  id: string,
  title: string,
  titleMl: string,
  surah: number,
  start: number,
  end: number,
  refs: string[],
  note?: string,
) {
  const verses = Array.from({ length: end - start + 1 }, (_, i) => {
    const key = `${surah}:${start + i}`;
    const text = (quran.verses as Record<string, string>)[key];
    if (!text) throw new Error(`Missing Quran verse ${key}`);
    return { key, text };
  });
  items.push({
    id,
    title,
    titleMl,
    type: start === 1 ? 'surah' : 'ayah',
    surahNumber: surah,
    ayahStart: start,
    ayahEnd: end,
    arabic: verses.map((v) => v.text).join('\n'),
    verses,
    references: refs,
    note,
    review:
      'Arabic: verbatim Tanzil Uthmani 1.1. Translation and transliteration await licensed source acquisition and qualified English/Malayalam review.',
  });
}
Quran(
  'kursi',
  'Ayat al-Kursi',
  'ആയത്തുൽ കുർസി',
  2,
  255,
  255,
  [r.kursi],
  'Bukhari 2311 establishes bedtime recitation. Morning/evening and after-Salah reports require separate grading review; their evidence is not equivalent to this Sahih bedtime narration.',
);
Quran('ikhlas', 'Al-Ikhlas', 'അൽ ഇഖ്‌ലാസ്', 112, 1, 4, [r.three, r.sleep, r.prayer]);
Quran('falaq', 'Al-Falaq', 'അൽ ഫലഖ്', 113, 1, 5, [r.three, r.sleep, r.prayer]);
Quran('nas', 'An-Nas', 'അന്നാസ്', 114, 1, 6, [r.three, r.sleep, r.prayer]);
Quran(
  'last-two',
  'Last two verses of Al-Baqarah',
  'അൽ ബഖറയുടെ അവസാന രണ്ട് ആയത്തുകൾ',
  2,
  285,
  286,
  [r.night],
  'The narration says at night, not exclusively immediately before sleep.',
);
Quran(
  'kahf',
  'Al-Kahf',
  'അൽ കഹ്ഫ്',
  18,
  1,
  110,
  [],
  'Friday recitation is a scholarly recommendation based on reports with grading discussion. Specific Friday virtue and reference await qualified review; no reward claim is made here.',
);
Quran(
  'mulk',
  'Al-Mulk',
  'അൽ മുൽക്ക്',
  67,
  1,
  30,
  [r.mulk],
  'The thirty-verse Surah intercession report does not itself fix a nightly schedule. Night is an optional personal reminder.',
);
Quran(
  'baqarah',
  'Al-Baqarah',
  'അൽ ബഖറ',
  2,
  1,
  286,
  [r.home],
  'Regular recitation at home; no fixed daily or weekly completion requirement.',
);
Quran(
  'fatihah',
  'Al-Fatihah',
  'അൽ ഫാതിഹ',
  1,
  1,
  7,
  [r.fatihah],
  'Recited in Salah. The tracker records a personal reading, not whether a prayer is valid.',
);
function dua(
  id: string,
  title: string,
  titleMl: string,
  arabic: string,
  en: string,
  ml: string,
  te: string,
  tm: string,
  refs: string[],
  note?: string,
) {
  items.push({
    id,
    title,
    titleMl,
    type: 'dua',
    arabic,
    translation: { en, ml },
    transliteration: { en: te, ml: tm },
    references: refs,
    note,
    review:
      'Arabic wording checked against linked narration. Explanatory translations and pronunciation guides are editorial drafts awaiting qualified bilingual review; not certified translations.',
  });
}
dua(
  'istighfar',
  'Sayyidul Istighfar',
  'സയ്യിദുൽ ഇസ്തിഗ്ഫാർ',
  'اللَّهُمَّ أَنْتَ رَبِّي، لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  'O Allah, You are my Lord; none deserves worship except You. You created me and I am Your servant. I keep Your covenant and promise as far as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and my sin. Forgive me; only You forgive sins.',
  'അല്ലാഹുവേ, നീയാണ് എന്റെ രക്ഷിതാവ്. നീയല്ലാതെ ആരാധനയ്ക്ക് അർഹനില്ല. നീ എന്നെ സൃഷ്ടിച്ചു; ഞാൻ നിന്റെ ദാസനാണ്. എനിക്ക് കഴിയുന്നത്ര നിന്റെ കരാറും വാഗ്ദാനവും പാലിക്കുന്നു. ഞാൻ ചെയ്തതിന്റെ തിന്മയിൽ നിന്ന് നിന്നോട് അഭയം തേടുന്നു. നിന്റെ അനുഗ്രഹവും എന്റെ പാപവും ഞാൻ സമ്മതിക്കുന്നു. എനിക്ക് പൊറുത്തുതരേണമേ. നീയല്ലാതെ പാപങ്ങൾ പൊറുക്കുന്നവനില്ല.',
  'Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu. Audhu bika min sharri ma sanatu. Abu’u laka binimatika alayya wa abu’u laka bidhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.',
  'അല്ലാഹുമ്മ അൻത റബ്ബീ, ലാ ഇലാഹ ഇല്ലാ അൻത, ഖലഖ്തനീ വ അന അബ്ദുക, വ അന അലാ അഹ്ദിക വ വഅ്ദിക മസ്തത്വഅ്തു. അഊദു ബിക മിൻ ശർറി മാ സ്വനഅ്തു. അബൂഉ ലക ബിനിഅ്മതിക അലയ്യ വ അബൂഉ ലക ബിദൻബീ, ഫഗ്ഫിർ ലീ, ഫഇന്നഹു ലാ യഗ്ഫിറുദ്ദുനൂബ ഇല്ലാ അൻത.',
  [r.forgiveness],
);
dua(
  'bismillah',
  'Bismillahil-ladhi la yadurru',
  'ബിസ്മില്ലാഹില്ലദീ ലാ യദുർറു',
  'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
  'In Allah’s name, with whose name nothing on earth or in heaven can harm; He hears and knows all.',
  'അല്ലാഹുവിന്റെ നാമത്തിൽ; അവന്റെ നാമത്തോടൊപ്പം ഭൂമിയിലോ ആകാശത്തിലോ ഒന്നും ഉപദ്രവിക്കുകയില്ല. അവൻ എല്ലാം കേൾക്കുന്നവനും അറിയുന്നവനുമാണ്.',
  'Bismillahil-ladhi la yadurru maasmihi shay’un fil-ardi wa la fis-sama’i wa huwas-Samiul-Alim.',
  'ബിസ്മില്ലാഹില്ലദീ ലാ യദുർറു മഅസ്മിഹീ ശൈഉൻ ഫിൽ അർദ്വി വ ലാ ഫിസ്സമാഇ വ ഹുവസ്സമീഉൽ അലീം.',
  [r.protection],
);
dua(
  'raditu',
  'Raditu billahi Rabban',
  'റദീതു ബില്ലാഹി റബ്ബൻ',
  'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
  'I am content with Allah as Lord, Islam as religion, and Muhammad as Prophet.',
  'അല്ലാഹുവിനെ രക്ഷിതാവായും ഇസ്‌ലാമിനെ മതമായും മുഹമ്മദിനെ നബിയായും ഞാൻ തൃപ്തിപ്പെട്ടിരിക്കുന്നു.',
  'Raditu billahi Rabban wa bil-Islami dinan wa bi-Muhammadin nabiyyan.',
  'റദീതു ബില്ലാഹി റബ്ബൻ വ ബിൽ ഇസ്‌ലാമി ദീനൻ വ ബി മുഹമ്മദിൻ നബിയ്യൻ.',
  [r.pleased, r.pleasedWeak],
  'Grading differs across related chains. Tirmidhi 3389 gives evening wording without a three-count. Three repetitions here remain a user-requested tracking target pending review, not a verified prescribed count.',
);
dua(
  'refuge',
  'A’udhu bikalimatillahit-tammati',
  'അഊദു ബികലിമാതില്ലാഹി',
  'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  'I seek refuge in Allah’s perfect words from the evil of what He created.',
  'അല്ലാഹുവിന്റെ പൂർണ്ണമായ വചനങ്ങളിൽ, അവൻ സൃഷ്ടിച്ചവയുടെ തിന്മയിൽ നിന്ന് ഞാൻ അഭയം തേടുന്നു.',
  'Audhu bikalimatillahit-tammati min sharri ma khalaq.',
  'അഊദു ബികലിമാതില്ലാഹിത്താമ്മാതി മിൻ ശർറി മാ ഖലഖ്.',
  [r.refuge],
);
dua(
  'praise',
  'SubhanAllahi wa bihamdihi',
  'സുബ്ഹാനല്ലാഹി വ ബിഹംദിഹി',
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  'Glory and praise belong to Allah.',
  'അല്ലാഹുവിനെ സ്തുതിക്കുന്നതോടൊപ്പം അവന്റെ പരിശുദ്ധിയെ വാഴ്ത്തുന്നു.',
  'SubhanAllahi wa bihamdihi.',
  'സുബ്ഹാനല്ലാഹി വ ബിഹംദിഹി.',
  [r.hundred],
);
dua(
  'astaghfirullah',
  'Astaghfirullah',
  'അസ്തഗ്ഫിറുല്ലാഹ്',
  'أَسْتَغْفِرُ اللَّهَ',
  'I ask Allah for forgiveness.',
  'ഞാൻ അല്ലാഹുവിനോട് പാപമോചനം തേടുന്നു.',
  'Astaghfirullah.',
  'അസ്തഗ്ഫിറുല്ലാഹ്.',
  [r.peace],
);
dua(
  'salam',
  'Allahumma antas-salam',
  'അല്ലാഹുമ്മ അൻതസ്സലാം',
  'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ ذَا الْجَلَالِ وَالْإِكْرَامِ',
  'O Allah, You are Peace and peace comes from You. Blessed are You, Possessor of majesty and honor.',
  'അല്ലാഹുവേ, നീയാണ് സമാധാനം; നിന്നിൽ നിന്നാണ് സമാധാനം. മഹത്വവും ആദരവും ഉള്ളവനേ, നീ അനുഗ്രഹപൂർണ്ണനാണ്.',
  'Allahumma antas-salamu wa minkas-salamu tabarakta dhal-jalali wal-ikram.',
  'അല്ലാഹുമ്മ അൻതസ്സലാമു വ മിൻകസ്സലാമു തബാറക്ത ദൽ ജലാലി വൽ ഇക്‌റാം.',
  [r.peace],
);
dua(
  'subhanallah',
  'SubhanAllah',
  'സുബ്ഹാനല്ലാഹ്',
  'سُبْحَانَ اللَّهِ',
  'Glory be to Allah.',
  'അല്ലാഹു പരിശുദ്ധനാണ്.',
  'SubhanAllah.',
  'സുബ്ഹാനല്ലാഹ്.',
  [r.tasbih, r.alternative, r.bedtime],
);
dua(
  'alhamdulillah',
  'Alhamdulillah',
  'അൽഹംദുലില്ലാഹ്',
  'الْحَمْدُ لِلَّهِ',
  'All praise belongs to Allah.',
  'എല്ലാ സ്തുതിയും അല്ലാഹുവിനാണ്.',
  'Alhamdulillah.',
  'അൽഹംദുലില്ലാഹ്.',
  [r.tasbih, r.alternative, r.bedtime],
);
dua(
  'akbar',
  'Allahu Akbar',
  'അല്ലാഹു അക്ബർ',
  'اللَّهُ أَكْبَرُ',
  'Allah is the Greatest.',
  'അല്ലാഹു ഏറ്റവും മഹാനാണ്.',
  'Allahu Akbar.',
  'അല്ലാഹു അക്ബർ.',
  [r.tasbih, r.alternative, r.bedtime],
);
dua(
  'tawhid',
  'Declaration of Tawhid',
  'തൗഹീദിന്റെ പ്രഖ്യാപനം',
  'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  'None deserves worship except Allah alone, with no partner. Sovereignty and praise belong to Him, and He has power over everything.',
  'അല്ലാഹു മാത്രമാണ് ആരാധനയ്ക്ക് അർഹൻ. അവന് പങ്കുകാരില്ല. ആധിപത്യവും സ്തുതിയും അവനാണ്. അവൻ എല്ലാ കാര്യത്തിനും കഴിവുള്ളവനാണ്.',
  'La ilaha illAllahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay’in qadir.',
  'ലാ ഇലാഹ ഇല്ലല്ലാഹു വഹ്ദഹു ലാ ശരീക ലഹ്, ലഹുൽ മുൽകു വ ലഹുൽ ഹംദു വ ഹുവ അലാ കുല്ലി ശൈഇൻ ഖദീർ.',
  [r.tasbih],
);
export const recitations = Object.fromEntries(
  items.map((item) => [
    item.id,
    {
      ...item,
      type: [
        'praise',
        'astaghfirullah',
        'subhanallah',
        'alhamdulillah',
        'akbar',
        'tawhid',
      ].includes(item.id)
        ? ('dhikr' as const)
        : item.type,
      sourceVersion: CONTENT_VERSION,
    },
  ]),
);
