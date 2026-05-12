/**
 * The book catalog and bundled content. No backend; this file is the source
 * of truth for what books the app knows about by default.
 *
 * Each entry has two parts:
 *   - Metadata in `CATALOG_BOOKS` — title, deity, audio tracks, etc.
 *   - Optional content in `BUNDLED_CONTENT` — full chapters/verses, JS-embedded
 *     so they work fully offline with no download.
 *
 * Books listed here without a corresponding BUNDLED_CONTENT entry are fetched
 * on demand from `Config.contentBaseUrl` (a static host you control — see
 * docs/CONTENT_HOSTING.md). They appear in the library and can be downloaded
 * for offline use.
 *
 * AUDIO TRACKS
 * ------------
 * Every audio URL must point at a recording whose copyright status you have
 * personally verified as public domain or CC0. The vast majority of Sanskrit
 * chant recordings online are copyrighted performances even when the
 * underlying scripture is not. See docs/CONTENT_LICENSING.md.
 *
 * The arrays below are deliberately empty. As you find verified PD/CC0
 * recordings (LibriVox, Wikimedia Commons, specific sanskritdocuments.org
 * audio sets), add them to the relevant book.
 *
 * As a fallback, the app's TTSService can synthesize speech from the verse
 * text using the device's built-in TTS engine. That's always copyright-safe.
 */

import {
  Book,
  BookWithChapters,
  AudioTrack,
} from '@/types';

// Empty until verified PD/CC0 recordings are added. See CONTENT_LICENSING.md.
const NO_AUDIO: AudioTrack[] = [];

// =============================================================================
// Catalog metadata — books available in the app
// =============================================================================

export const CATALOG_BOOKS: Book[] = [
  // ----- Bundled (fully offline, no download needed) -----
  {
    id: 'hanuman-chalisa',
    title: 'Hanuman Chalisa',
    sanskritTitle: 'हनुमान चालीसा',
    deityId: 'hanuman',
    category: 'chalisa',
    description:
      'The 40-verse devotional hymn to Lord Hanuman composed by Tulsidas (c. 1574). One of the most recited prayers in Hinduism.',
    language: ['sa', 'hi', 'en'],
    chapterCount: 1,
    verseCount: 40,
    isLocal: true,
    isPublicDomain: true,
    source:
      'Composed by Tulsidas (1532–1623). Awadhi text public domain. English paraphrases by Divya Granth project.',
    coverColor: '#b45309',
    audio: NO_AUDIO,
  },
  {
    id: 'shiva-tandava-stotra',
    title: 'Shiva Tandava Stotra',
    sanskritTitle: 'शिवताण्डवस्तोत्रम्',
    deityId: 'shiva',
    category: 'stotra',
    description:
      "A hymn extolling Lord Shiva's cosmic dance, traditionally ascribed to Ravana. Famous for its rolling rhythmic meter.",
    language: ['sa', 'en'],
    chapterCount: 1,
    verseCount: 3,
    isLocal: true,
    isPublicDomain: true,
    source:
      'Traditional, public domain. English paraphrases by Divya Granth project.',
    coverColor: '#4B0000',
    audio: NO_AUDIO,
  },
  {
    id: 'ganesha-mantras',
    title: 'Ganesha Mantras',
    sanskritTitle: 'गणेश मन्त्राः',
    deityId: 'ganesha',
    category: 'mantra',
    description:
      'Traditional invocations to Lord Ganesha recited at the start of new ventures and rituals.',
    language: ['sa', 'en'],
    chapterCount: 1,
    verseCount: 3,
    isLocal: true,
    isPublicDomain: true,
    source:
      'Traditional Vedic / Puranic mantras, public domain. English paraphrases by Divya Granth project.',
    coverColor: '#9a3412',
    audio: NO_AUDIO,
  },

  // ----- Network-only (require contentBaseUrl + manifest) -----
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    sanskritTitle: 'श्रीमद्भगवद्गीता',
    deityId: 'krishna',
    category: 'gita',
    description:
      "The Song of the Lord — Krishna's discourse to Arjuna on duty, devotion, and the nature of the self. 18 chapters, 700 verses.",
    language: ['sa', 'hi', 'en'],
    chapterCount: 18,
    verseCount: 700,
    isLocal: false,
    isPublicDomain: true,
    source:
      'Sanskrit public domain. English paraphrases by Divya Granth project; portions adapted from Edwin Arnold (1885), public domain.',
    coverColor: '#1e40af',
    audio: NO_AUDIO,
  },
  {
    id: 'vishnu-sahasranama',
    title: 'Vishnu Sahasranama',
    sanskritTitle: 'विष्णुसहस्रनाम',
    deityId: 'vishnu',
    category: 'stotra',
    description:
      "The thousand names of Lord Vishnu from the Mahabharata's Anushasana Parva, narrated by Bhishma to Yudhishthira.",
    language: ['sa', 'en'],
    chapterCount: 1,
    verseCount: 107,
    isLocal: false,
    isPublicDomain: true,
    source:
      'From Mahabharata Anushasana Parva, public domain Sanskrit. Transliteration and paraphrase by Divya Granth project.',
    coverColor: '#1e3a8a',
    audio: NO_AUDIO,
  },
  {
    id: 'sundara-kanda',
    title: 'Sundara Kanda',
    sanskritTitle: 'सुन्दरकाण्ड',
    deityId: 'hanuman',
    category: 'itihasa',
    description:
      "The 5th book of Valmiki's Ramayana — Hanuman's journey to Lanka. Reciting it is said to bring courage and devotion.",
    language: ['sa', 'en'],
    chapterCount: 68,
    verseCount: 2885,
    isLocal: false,
    isPublicDomain: true,
    source:
      'Valmiki Ramayana, public domain Sanskrit. English: adapted from Griffith (1895), public domain.',
    coverColor: '#065f46',
    audio: NO_AUDIO,
  },
  {
    id: 'isha-upanishad',
    title: 'Isha Upanishad',
    sanskritTitle: 'ईशोपनिषद्',
    deityId: 'general',
    category: 'upanishad',
    description:
      'One of the shortest and most condensed of the principal Upanishads — 18 verses on the all-pervading nature of the Self.',
    language: ['sa', 'en'],
    chapterCount: 1,
    verseCount: 18,
    isLocal: false,
    isPublicDomain: true,
    source:
      "Public domain Sanskrit. English: adapted from Müller's Sacred Books of the East (1879), public domain.",
    coverColor: '#0c4a6e',
    audio: NO_AUDIO,
  },
];

// =============================================================================
// Bundled content — full text for the always-offline books above
// =============================================================================

const META = (id: string): Book => {
  const m = CATALOG_BOOKS.find(b => b.id === id);
  if (!m) throw new Error(`Catalog entry missing for ${id}`);
  return m;
};

export const BUNDLED_CONTENT: Record<string, BookWithChapters> = {
  // -------------------------------------------------------------------------
  // Hanuman Chalisa — sample of 6 of 40 verses + opening doha. Full text can
  // be added by mirroring the same shape. Sanskrit/Awadhi public domain;
  // English paraphrases written for this project.
  // -------------------------------------------------------------------------
  'hanuman-chalisa': {
    ...META('hanuman-chalisa'),
    chapters: [
      {
        id: 'hc-1',
        bookId: 'hanuman-chalisa',
        number: 1,
        title: 'Chalisa',
        sanskritTitle: 'चालीसा',
        verses: [
          {
            number: 1,
            sanskrit:
              'श्रीगुरु चरन सरोज रज, निज मन मुकुरु सुधारि।\nबरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥',
            transliteration:
              'Śrīguru carana saroja raja, nija mana mukuru sudhāri.\nBaranauṃ raghubara bimala jasu, jo dāyaku phala cāri.',
            translations: {
              en: "Cleansing the mirror of my mind with the dust of my Guru's lotus feet, I sing the pure glory of Raghuvara, who bestows the four fruits of life.",
              hi: 'गुरु के चरण-कमलों की धूलि से अपने मन-दर्पण को शुद्ध करके, मैं उन रघुनाथ के निर्मल यश का वर्णन करता हूँ जो चार फल देने वाले हैं।',
            },
          },
          {
            number: 2,
            sanskrit:
              'बुद्धिहीन तनु जानिकै, सुमिरौं पवन कुमार।\nबल बुद्धि बिद्या देहु मोहिं, हरहु कलेस बिकार॥',
            transliteration:
              'Buddhihīna tanu jānikai, sumirauṃ pavana kumāra.\nBala buddhi bidyā dehu mohiṃ, harahu kalesa bikāra.',
            translations: {
              en: "Knowing my body to be lacking in wisdom, I remember Pavana's son. Grant me strength, intelligence, and knowledge; remove my afflictions and faults.",
              hi: 'अपने शरीर को बुद्धिहीन जानकर मैं पवनपुत्र का स्मरण करता हूँ। मुझे बल, बुद्धि और विद्या दीजिए; मेरे दुःख और दोष हर लीजिए।',
            },
          },
          {
            number: 3,
            sanskrit:
              'जय हनुमान ज्ञान गुण सागर।\nजय कपीस तिहुँ लोक उजागर॥',
            transliteration:
              'Jaya Hanumāna jñāna guṇa sāgara.\nJaya kapīsa tihuṃ loka ujāgara.',
            translations: {
              en: 'Glory to Hanuman, ocean of wisdom and virtue! Glory to the lord of monkeys, illuminator of the three worlds!',
              hi: 'जय हनुमान, ज्ञान और गुणों के सागर! जय कपीश, तीनों लोकों को प्रकाशित करने वाले!',
            },
          },
          {
            number: 4,
            sanskrit:
              'राम दूत अतुलित बल धामा।\nअंजनि पुत्र पवन सुत नामा॥',
            transliteration:
              'Rāma dūta atulita bala dhāmā.\nAñjani putra pavana suta nāmā.',
            translations: {
              en: "Messenger of Rama, abode of immeasurable strength — known as Anjani's son and son of the wind.",
              hi: 'श्रीराम के दूत, अतुलनीय बल के धाम, अंजनी के पुत्र, पवन-पुत्र नाम से प्रसिद्ध।',
            },
          },
          {
            number: 5,
            sanskrit:
              'महाबीर बिक्रम बजरंगी।\nकुमति निवार सुमति के संगी॥',
            transliteration:
              'Mahābīra bikrama bajaraṃgī.\nKumati nivāra sumati ke saṃgī.',
            translations: {
              en: 'Great hero, mighty as a thunderbolt; you dispel evil thoughts and are a companion of those with good understanding.',
              hi: 'महावीर, पराक्रमी, वज्र-अंगों वाले — कुमति को दूर करते हैं और सुमति के साथी हैं।',
            },
          },
          {
            number: 6,
            sanskrit: 'जै जै जै हनुमान गोसाईं।\nकृपा करहु गुरुदेव की नाईं॥',
            transliteration:
              'Jai jai jai Hanumāna gosāīṃ.\nKṛpā karahu gurudeva kī nāīṃ.',
            translations: {
              en: 'Victory, victory, victory, O Lord Hanuman! Be gracious to me as a Guru would be.',
              hi: 'हे स्वामी हनुमान! जय जय जय! गुरुदेव की तरह मुझ पर कृपा करें।',
            },
          },
          {
            number: 7,
            sanskrit:
              'जो शत बार पाठ कर कोई।\nछूटहि बंदि महा सुख होई॥',
            transliteration:
              'Jo śata bāra pāṭha kara koī.\nChūṭahi baṃdi mahā sukha hoī.',
            translations: {
              en: 'Whoever recites this a hundred times is freed from bondage and attains supreme joy.',
              hi: 'जो इसे सौ बार पाठ करता है, वह सभी बंधनों से मुक्त होकर महान सुख पाता है।',
            },
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Shiva Tandava Stotra — first 3 verses
  // -------------------------------------------------------------------------
  'shiva-tandava-stotra': {
    ...META('shiva-tandava-stotra'),
    chapters: [
      {
        id: 'sts-1',
        bookId: 'shiva-tandava-stotra',
        number: 1,
        title: 'Hymn',
        sanskritTitle: 'स्तोत्रम्',
        verses: [
          {
            number: 1,
            sanskrit:
              'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम्॥',
            transliteration:
              "jaṭāṭavī-galaj-jala-pravāha-pāvita-sthale gale'valambya lambitāṃ bhujaṅga-tuṅga-mālikām.\nḍamaḍ-ḍamaḍ-ḍamaḍ-ḍaman-ninādavaḍ-ḍamarvayaṃ cakāra caṇḍa-tāṇḍavaṃ tanotu naḥ śivaḥ śivam.",
            translations: {
              en: 'From the forest of his matted locks the river Ganga streams down and sanctifies the ground; on his neck hangs a tall garland of serpents; to the rolling beat of damaru drums he performs his fierce cosmic dance. May Shiva grant us auspiciousness.',
            },
          },
          {
            number: 2,
            sanskrit:
              'जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी विलोलवीचिवल्लरीविराजमानमूर्धनि।\nधगद्धगद्धगज्ज्वलल्ललाटपट्टपावके किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम॥',
            transliteration:
              'jaṭā-kaṭāha-sambhrama-bhraman-nilimpa-nirjharī vilola-vīci-vallarī-virājamāna-mūrdhani.\ndhagad-dhagad-dhagaj-jvalal-lalāṭa-paṭṭa-pāvake kiśora-candra-śekhare ratiḥ pratikṣaṇaṃ mama.',
            translations: {
              en: 'On his head dances the heavenly river, its rippling waves swirling through the cauldron of his matted hair; on his forehead a fire blazes; the crescent moon adorns his crown. May my devotion to him grow with every moment.',
            },
          },
          {
            number: 3,
            sanskrit:
              'धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुर स्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे।\nकृपाकटाक्षधोरणीनिरुद्धदुर्धरापदि क्वचिद्दिगम्बरे मनो विनोदमेतु वस्तुनि॥',
            transliteration:
              'dharā-dharendra-nandinī-vilāsa-bandhu-bandhura sphurad-diganta-santati-pramodamāna-mānase.\nkṛpā-kaṭākṣa-dhoraṇī-niruddha-durdharāpadi kvacid-digambare mano vinodam etu vastuni.',
            translations: {
              en: 'Companion to the playful daughter of the mountain-king, his mind delights in all radiant directions; the stream of his merciful glance dispels even the gravest calamities. May my mind find joy in him — the sky-clad one.',
            },
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Ganesha Mantras
  // -------------------------------------------------------------------------
  'ganesha-mantras': {
    ...META('ganesha-mantras'),
    chapters: [
      {
        id: 'gm-1',
        bookId: 'ganesha-mantras',
        number: 1,
        title: 'Invocations',
        sanskritTitle: 'आवाहनम्',
        verses: [
          {
            number: 1,
            sanskrit:
              'वक्रतुण्ड महाकाय सूर्यकोटिसमप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
            transliteration:
              'vakratuṇḍa mahākāya sūryakoṭi-samaprabha.\nnirvighnaṃ kuru me deva sarva-kāryeṣu sarvadā.',
            translations: {
              en: 'O curve-trunked one, mighty in form, radiant as ten million suns — make all my undertakings free from obstacles, always.',
              hi: 'हे वक्रतुंड, विशाल रूप धारी, करोड़ों सूर्यों के समान प्रकाशमान — हे देव, सदा मेरे सभी कार्यों में विघ्न दूर करें।',
            },
          },
          {
            number: 2,
            sanskrit:
              'गजाननं भूतगणादिसेवितं कपित्थजम्बूफलचारुभक्षणम्।\nउमासुतं शोकविनाशकारणं नमामि विघ्नेश्वरपादपङ्कजम्॥',
            transliteration:
              'gajānanaṃ bhūta-gaṇādi-sevitaṃ kapittha-jambū-phala-cāru-bhakṣaṇam.\numā-sutaṃ śoka-vināśa-kāraṇaṃ namāmi vighneśvara-pāda-paṅkajam.',
            translations: {
              en: 'I bow at the lotus feet of the elephant-faced one, attended by hosts of beings, who delights in eating wood-apples and rose-apples; the son of Uma, the dispeller of all sorrow.',
              hi: 'मैं उस विघ्नेश्वर के चरण-कमल को नमन करता हूँ जो गजमुख हैं, भूतगणों द्वारा सेवित हैं, कैथ और जामुन खाने वाले हैं, उमा के पुत्र हैं और शोक का नाश करने वाले हैं।',
            },
          },
          {
            number: 3,
            sanskrit: 'ॐ गं गणपतये नमः।',
            transliteration: 'oṃ gaṃ gaṇapataye namaḥ.',
            translations: {
              en: 'Om — salutations to Ganapati, lord of the ganas.',
              hi: 'ॐ — गणों के पति गणपति को नमस्कार।',
            },
          },
        ],
      },
    ],
  },
};

// =============================================================================
// Lookup helpers
// =============================================================================

export function getCatalogBook(id: string): Book | undefined {
  return CATALOG_BOOKS.find(b => b.id === id);
}

export function getBundledBook(id: string): BookWithChapters | undefined {
  return BUNDLED_CONTENT[id];
}
