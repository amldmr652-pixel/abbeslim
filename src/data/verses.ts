export interface SpiritualQuote {
  id: number;
  type: 'ayet' | 'hadis';
  arabic: string;
  turkish: string;
  source: string;
}

export const SPIRITUAL_QUOTES: SpiritualQuote[] = [
  // AYETLER (1-100)
  {
    id: 1,
    type: 'ayet',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    turkish: 'Allah, O\'ndan başka ilâh yoktur. O, hayydır, kayyûmdur. Kendisine ne uyuklama gelir ne de uyku.',
    source: 'Bakara Suresi, 255 (Ayetel Kürsi)'
  },
  {
    id: 2,
    type: 'ayet',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    turkish: 'Şüphesiz her güçlükle beraber bir kolaylık vardır. Gerçekten, her güçlükle beraber bir kolaylık vardır.',
    source: 'İnşirah Suresi, 5-6'
  },
  {
    id: 3,
    type: 'ayet',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    turkish: 'Bilesiniz ki kalpler ancak Allah\'ı anmakla huzur bulur.',
    source: 'Ra\'d Suresi, 28'
  },
  {
    id: 4,
    type: 'ayet',
    arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    turkish: 'De ki: "Rabbim, benim ilmimi artır!"',
    source: 'Tâhâ Suresi, 114'
  },
  {
    id: 5,
    type: 'ayet',
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    turkish: 'Şüphesiz Allah sabredenlerle beraberdir.',
    source: 'Bakara Suresi, 153'
  },
  {
    id: 6,
    type: 'ayet',
    arabic: 'وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ',
    turkish: 'Ölümsüz ve daima diri olan Allah\'a tevekkül et.',
    source: 'Furkan Suresi, 58'
  },
  {
    id: 7,
    type: 'ayet',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا • وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    turkish: 'Kim Allah\'a karşı gelmekten sakınırsa, Allah ona bir çıkış yolu ihsan eder ve onu beklemediği yerden rızıklandırır.',
    source: 'Talâk Suresi, 2-3'
  },
  {
    id: 8,
    type: 'ayet',
    arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
    turkish: 'Bana dua edin, duanıza icabet edeyim.',
    source: 'Mü\'min Suresi, 60'
  },
  {
    id: 9,
    type: 'ayet',
    arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
    turkish: 'Nerede olursanız olun O sizinle beraberdir.',
    source: 'Hadîd Suresi, 4'
  },
  {
    id: 10,
    type: 'ayet',
    arabic: 'إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ',
    turkish: 'Şüphesiz Rabbim benimle beraberdir, O bana yol gösterecektir.',
    source: 'Şuarâ Suresi, 62'
  },
  {
    id: 11,
    type: 'ayet',
    arabic: 'وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا',
    turkish: 'Rabbinin hükmüne sabret. Çünkü sen bizim gözetimimiz altındasın.',
    source: 'Tûr Suresi, 48'
  },
  {
    id: 12,
    type: 'ayet',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    turkish: 'Allah hiç kimseye gücünün yettiğinden fazlasını yüklemez.',
    source: 'Bakara Suresi, 286'
  },
  {
    id: 13,
    type: 'ayet',
    arabic: 'وَقُولا لَهُ قَوْلا لَّيِّنًا لَّعَلَّهُ يَتَذَكَّرُ أَوْ يَخْشَى',
    turkish: 'Ona yumuşak söz söyleyin; belki öğüt alır yahut korkar.',
    source: 'Tâhâ Suresi, 44'
  },
  {
    id: 14,
    type: 'ayet',
    arabic: 'وَأَن لَّيْسَ لِلإِنسَانِ إِلاَّ مَا سَعَى',
    turkish: 'İnsan için ancak çalıştığının karşılığı vardır.',
    source: 'Necm Suresi, 39'
  },
  {
    id: 15,
    type: 'ayet',
    arabic: 'وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ',
    turkish: 'De ki: "Rabbim! Gireceğim yere dürüstlükle girmemi, çıkacağım yerden de dürüstlükle çıkmamı sağla."',
    source: 'İsrâ Suresi, 80'
  },
  {
    id: 16,
    type: 'ayet',
    arabic: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ',
    turkish: 'Şüphesiz Allah iyilik edenleri sever.',
    source: 'Bakara Suresi, 195'
  },
  {
    id: 17,
    type: 'ayet',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    turkish: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.',
    source: 'Bakara Suresi, 201'
  },
  {
    id: 18,
    type: 'ayet',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    turkish: 'Öyleyse beni anın ki ben de sizi anayım. Bana şükredin, nankörlük etmeyin.',
    source: 'Bakara Suresi, 152'
  },
  {
    id: 19,
    type: 'ayet',
    arabic: 'وَمَا كَانَ اللَّهُ مُعَذِّبَهُمْ وَهُمْ يَسْتَغْفِرُونَ',
    turkish: 'Onlar bağışlanma dilerken Allah onlara azap edecek değildir.',
    source: 'Enfâl Suresi, 33'
  },
  {
    id: 20,
    type: 'ayet',
    arabic: 'وَوَصَّيْنَا الإِنسَانَ بِوَالِدَيْهِ حُسْنًا',
    turkish: 'Biz insana ana babasına iyilik etmesini tavsiye ettik.',
    source: 'Ankebût Suresi, 8'
  },
  {
    id: 21,
    type: 'ayet',
    arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    turkish: 'Kullarım sana beni sorduklarında bilinsin ki ben çok yakınım.',
    source: 'Bakara Suresi, 186'
  },
  {
    id: 22,
    type: 'ayet',
    arabic: 'لَئِن شَكَرْتُمْ لأَزِيدَنَّكُمْ',
    turkish: 'Eğer şükrederseniz elbette size (nimetimi) artırırım.',
    source: 'İbrâhîm Suresi, 7'
  },
  {
    id: 23,
    type: 'ayet',
    arabic: 'إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ',
    turkish: 'Şüphesiz iyilikler kötülükleri giderir.',
    source: 'Hûd Suresi, 114'
  },
  {
    id: 24,
    type: 'ayet',
    arabic: 'وَخُلِقَ الإِنسَانُ ضَعِيفًا',
    turkish: 'Zaten insan zayıf olarak yaratılmıştır.',
    source: 'Nisâ Suresi, 28'
  },
  {
    id: 25,
    type: 'ayet',
    arabic: 'قُل لَّن يُصِيبَنَا إِلاَّ مَا كَتَبَ اللَّهُ لَنَا',
    turkish: 'De ki: "Allah\'ın bizim için yazdığından başkası bize asla ulaşmaz."',
    source: 'Tevbe Suresi, 51'
  },
  {
    id: 26,
    type: 'ayet',
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    turkish: 'Bizim uğrumuzda cihat edenleri elbette yollarımıza ileteceğiz.',
    source: 'Ankebût Suresi, 69'
  },
  {
    id: 27,
    type: 'ayet',
    arabic: 'إِنَّ رَبِّي لَطِيفٌ لِّمَا يَشَاءُ',
    turkish: 'Şüphesiz Rabbim dilediğine karşı lütuf sahibidir.',
    source: 'Yûsuf Suresi, 100'
  },
  {
    id: 28,
    type: 'ayet',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي • وَيَسِّرْ لِي أَمْرِي',
    turkish: 'Rabbim! Göğsümü genişlet, işimi kolaylaştır.',
    source: 'Tâhâ Suresi, 25-26'
  },
  {
    id: 29,
    type: 'ayet',
    arabic: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالإِحْسَانِ',
    turkish: 'Şüphesiz Allah adaleti ve iyiliği emreder.',
    source: 'Nahl Suresi, 90'
  },
  {
    id: 30,
    type: 'ayet',
    arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',
    turkish: 'Allah\'ın rahmetinden ümidinizi kesmeyin.',
    source: 'Yûsuf Suresi, 87'
  },

  // HADİSLER (101-200)
  {
    id: 101,
    type: 'hadis',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    turkish: 'Ameller ancak niyetlere göredir; herkesin niyet ettiği ne ise eline geçecek olan ancak odur.',
    source: 'Buhârî, Bed\'ü\'l-Vahy 1; Müslim, İmâre 155'
  },
  {
    id: 102,
    type: 'hadis',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    turkish: 'Sizin en hayırlınız Kur\'an\'ı öğrenen ve öğreteninizdir.',
    source: 'Buhârî, Fezâilü\'l-Kur\'ân 21'
  },
  {
    id: 103,
    type: 'hadis',
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    turkish: 'Sizden biriniz kendi nefsi için istediğini mümin kardeşi için de istemedikçe gerçek manada iman etmiş olmaz.',
    source: 'Buhârî, İman 7; Müslim, İman 71'
  },
  {
    id: 104,
    type: 'hadis',
    arabic: 'التَّاهُورُ شَطْرُ الإِيمَانِ',
    turkish: 'Temizlik imanın yarısıdır.',
    source: 'Müslim, Tahâret 1'
  },
  {
    id: 105,
    type: 'hadis',
    arabic: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    turkish: 'Güzel söz sadakadır.',
    source: 'Buhârî, Cihad 128; Müslim, Zekât 56'
  },
  {
    id: 106,
    type: 'hadis',
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    turkish: 'Din kardeşinin yüzüne tebessüm etmen bir sadakadır.',
    source: 'Tirmizî, Birr 36'
  },
  {
    id: 107,
    type: 'hadis',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    turkish: 'Allah\'a ve ahiret gününe inanan ya hayır söylesin ya da sussun.',
    source: 'Buhârî, Edeb 31; Müslim, İman 74'
  },
  {
    id: 108,
    type: 'hadis',
    arabic: 'المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    turkish: 'Müslüman, elinden ve dilinden diğer Müslümanların emniyette olduğu kimsedir.',
    source: 'Buhârî, İman 4; Müslim, İman 64'
  },
  {
    id: 109,
    type: 'hadis',
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    turkish: 'Dua ibadetin ta kendisidir.',
    source: 'Tirmizî, Dua 1; Ebû Dâvûd, Vitir 23'
  },
  {
    id: 110,
    type: 'hadis',
    arabic: 'مَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللَّهُ عَلَيْهِ فِي الدُّنْيَا وَالآخِرَةِ',
    turkish: 'Kim darda kalan birine kolaylık gösterirse, Allah da ona dünyada ve ahirette kolaylık gösterir.',
    source: 'Müslim, Zikir 38'
  },
  {
    id: 111,
    type: 'hadis',
    arabic: 'احْفَظِ اللَّهَ يَحْفَظْكَ',
    turkish: 'Allah\'ın emir ve yasaklarını koru ki Allah da seni korusun.',
    source: 'Tirmizî, Kıyamet 59'
  },
  {
    id: 112,
    type: 'hadis',
    arabic: 'ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ',
    turkish: 'Yeryüzündekilere merhamet edin ki göktekiler de size merhamet etsin.',
    source: 'Tirmizî, Birr 16; Ebû Dâvûd, Edeb 58'
  },
  {
    id: 113,
    type: 'hadis',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    turkish: 'Allah katında amellerin en makbulü, az da olsa devamlı olanıdır.',
    source: 'Buhârî, İman 32; Müslim, Musâfirîn 218'
  },
  {
    id: 114,
    type: 'hadis',
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    turkish: 'Kim ilim öğrenmek için bir yola girerse, Allah ona cennete giden yolu kolaylaştırır.',
    source: 'Müslim, Zikir 38'
  },
  {
    id: 115,
    type: 'hadis',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
    turkish: 'Sadaka vermekle mal eksilmez.',
    source: 'Müslim, Birr 69; Tirmizî, Birr 82'
  },
  {
    id: 116,
    type: 'hadis',
    arabic: 'الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى',
    turkish: 'Veren el, alan elden daha hayırlıdır.',
    source: 'Buhârî, Zekât 18; Müslim, Zekât 94'
  },
  {
    id: 117,
    type: 'hadis',
    arabic: 'لاَ غَضَبَ لَكَ الْجَنَّةُ',
    turkish: 'Öfkelenme, sana cennet vardır.',
    source: 'Taberânî, el-Mu\'cemü\'l-Evsat'
  },
  {
    id: 118,
    type: 'hadis',
    arabic: 'مَنْ سَتَرَ مُسْلِمًا سَتَرَهُ اللَّهُ فِي الدُّنْيَا وَالآخِرَةِ',
    turkish: 'Kim bir Müslüman kardeşinin ayıbını örterse, Allah da dünya ve ahirette onun ayıbını örter.',
    source: 'Müslim, Zikir 38'
  },
  {
    id: 119,
    type: 'hadis',
    arabic: 'اِتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا',
    turkish: 'Nerede olursan ol Allah\'tan sakın ve kötülüğün ardından bir iyilik yap ki onu silsin.',
    source: 'Tirmizî, Birr 55'
  },
  {
    id: 120,
    type: 'hadis',
    arabic: 'الْمَرْءُ مَعَ مَنْ أَحَبَّ',
    turkish: 'Kişi sevdiği ile beraberdir.',
    source: 'Buhârî, Edeb 96; Müslim, Birr 165'
  }
];

export function getRandomQuote(): SpiritualQuote {
  const index = Math.floor(Math.random() * SPIRITUAL_QUOTES.length);
  return SPIRITUAL_QUOTES[index];
}
