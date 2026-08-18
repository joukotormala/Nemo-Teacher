'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/language-context';
import {
  ArrowLeft,
  Play,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Youtube,
  Tv,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VideoEpisode {
  episodeNumber: number;
  id: string;
  title_en: string;
  title_sv: string;
  title_th: string;
  location_en: string;
  location_sv: string;
  location_th: string;
  desc_en: string;
  desc_sv: string;
  desc_th: string;
  region_en: string;
  region_sv: string;
  region_th: string;
}

export const THAILAND_EPISODES: VideoEpisode[] = [
  {
    episodeNumber: 1,
    id: '8jJhoKV_8Os',
    title_en: 'Koh Libong: A Family Adventure on the Thai Island No One Visits',
    title_sv: 'Koh Libong: Familjeäventyr på ön i södra Thailand',
    title_th: 'เกาะลิบง: ผจญภัยตามหาพะยูนและเกาะลับเมืองตรัง',
    location_en: 'Koh Libong, Trang',
    location_sv: 'Koh Libong, Trang',
    location_th: 'เกาะลิบง จ.ตรัง',
    region_en: 'Southern Thailand (Andaman)',
    region_sv: 'Södra Thailand (Andaman)',
    region_th: 'ภาคใต้ (ทะเลอันดามัน)',
    desc_en: 'Spotting wild dugongs, discovering peaceful fishing villages, seagrass beds, and pristine island life.',
    desc_sv: 'Spana efter vilda sjökor (dugonger), utforska lugna fiskebyar och njut av orörd natur på ön.',
    desc_th: 'ส่องพะยูนฝูงสุดท้าย สัมผัสวิถีชีวิตชาวเกาะ และธรรมชาติที่เงียบสงบ',
  },
  {
    episodeNumber: 2,
    id: 'f78IzBXg3J8',
    title_en: 'From Bangkok to Southern Thailand, As Slowly As Possible',
    title_sv: 'Från Bangkok till södra Thailand – Så långsamt som möjligt',
    title_th: 'จากกรุงเทพสู่ภาคใต้ เดินทางแบบช้าๆ สัมผัสธรรมชาติ',
    location_en: 'Bangkok to South Overland',
    location_sv: 'Tåg & bilresa söderut',
    location_th: 'กรุงเทพฯ - ภาคใต้',
    region_en: 'Central to Southern Thailand',
    region_sv: 'Centrala till södra Thailand',
    region_th: 'ภาคกลางสู่ภาคใต้',
    desc_en: 'A slow family journey by train and road down the Thai peninsula, discovering roadside local gems.',
    desc_sv: 'En fantastisk tågresa och biltur genom Thailands vackra landskap, småstäder och tågstationer.',
    desc_th: 'การเดินทางแบบช้าๆ ด้วยรถไฟและถนน ผ่านชุมชนและทิวทัศน์สวยงามของภาคใต้',
  },
  {
    episodeNumber: 3,
    id: 'P6L6Z86r4QI',
    title_en: 'Why Nobody Visits Koh Phra Thong (And Why You Should)',
    title_sv: 'Koh Phra Thong: Den gyllene savann-ön som få besöker',
    title_th: 'เกาะพระทอง: เกาะทุ่งหญ้าสะวันนาและกวางป่าแห่งพังงา',
    location_en: 'Koh Phra Thong, Phang Nga',
    location_sv: 'Koh Phra Thong, Phang Nga',
    location_th: 'เกาะพระทอง จ.พังงา',
    region_en: 'Andaman Coast',
    region_sv: 'Andamankusten',
    region_th: 'ชายฝั่งอันดามัน',
    desc_en: 'Unique golden savanna grassland in tropical Thailand, wild deer, sea turtles, and deserted beaches.',
    desc_sv: 'En unik ö med gyllene grässavann, vilda hjortar, havssköldpaddor och vidsträckta stränder.',
    desc_th: 'ทุ่งหญ้าสีทองแปลกตา กวางป่า เต่าทะเล และหาดทรายยาวสุดลูกหูลูกตา',
  },
  {
    episodeNumber: 4,
    id: '0adr-8kALn8',
    title_en: 'We Found Thailand’s Best Snorkeling in the Surin Islands',
    title_sv: 'Surin-öarna: Thailands bästa snorkling & korallrev',
    title_th: 'หมู่เกาะสุรินทร์: จุดดำน้ำตื้นที่ดีที่สุดและชาวเลมอแกน',
    location_en: 'Mu Ko Surin National Park',
    location_sv: 'Surin-öarnas nationalpark',
    location_th: 'อุทยานแห่งชาติหมู่เกาะสุรินทร์',
    region_en: 'Andaman Sea',
    region_sv: 'Andamansjön',
    region_th: 'ทะเลอันดามัน',
    desc_en: 'Crystal clear water, coral reef marine life, clownfish, beach tent camping, and Moken sea nomad culture.',
    desc_sv: 'Kristallklart vatten, färgglada clownfiskar, levande koraller, tält på stranden och Moken-folket.',
    desc_th: 'โลกใต้ทะเลที่สมบูรณ์ ปลานีโม ปะการังน้ำตื้น กางเต็นท์ริมหาด และวิถีชาวเลมอแกน',
  },
  {
    episodeNumber: 5,
    id: 'ubZGsuObwCY',
    title_en: 'Why We Left the Khao Lak Resorts (And Where We Went Instead)',
    title_sv: 'Bortom Khao Lak: Upptäck det genuina Phang Nga',
    title_th: 'เขาหลักและพังงา: สำรวจธรรมชาติอันซีนและอาหารท้องถิ่น',
    location_en: 'Phang Nga Coastline',
    location_sv: 'Phang Nga-kusten',
    location_th: 'ชายฝั่งพังงา',
    region_en: 'Phang Nga Province',
    region_sv: 'Phang Nga-provinsen',
    region_th: 'จ.พังงา',
    desc_en: 'Leaving tourist resorts behind to explore hidden local waterfalls, peaceful beaches, and authentic food.',
    desc_sv: 'Att lämna hotellresorterna för att hitta dolda vattenfall, lokala byar och underbar thaimat.',
    desc_th: 'หลีกหนีความวุ่นวายไปค้นหาน้ำตกซ่อนเร้น หาดเงียบสงบ และอาหารท้องถิ่น',
  },
  {
    episodeNumber: 6,
    id: 'HUtvdXmMZck',
    title_en: 'Cruising Thailand\'s Phang Nga Bay with Kids',
    title_sv: 'Phang Nga-bukten: Båttur bland grottor och klippöar med barn',
    title_th: 'ล่องเรืออ่าวพังงา: ถ้ำทะเล เขาหินปูน และเกาะปันหยี',
    location_en: 'Phang Nga Bay',
    location_sv: 'Phang Nga-bukten',
    location_th: 'อ่าวพังงา',
    region_en: 'Phang Nga Bay',
    region_sv: 'Phang Nga-bukten',
    region_th: 'อ่าวพังงา',
    desc_en: 'Towering limestone karst pillars, tidal sea caves, and the incredible floating stilt village of Koh Panyee.',
    desc_sv: 'Höga kalkstensklippor som reser sig ur havet, havsgrottor och den flytande fiskebyn Koh Panyee.',
    desc_th: 'นั่งเรือหางยาวลัดเลาะเขาหินปูน พายเรือลอดถ้ำ และหมู่บ้านลอยน้ำเกาะปันหยี',
  },
  {
    episodeNumber: 7,
    id: 'BE7VPruPpvU',
    title_en: 'Finding the Crystal-Clear Jungle Springs of Surat Thani, Thailand',
    title_sv: 'Surat Thani: Kristallklara djungelkällor i regnskogen',
    title_th: 'ป่าต้นน้ำบ้านน้ำราด สุราษฎร์ธานี: ตาน้ำใสกลางป่าฝน',
    location_en: 'Ban Nam Rad, Surat Thani',
    location_sv: 'Ban Nam Rad, Surat Thani',
    location_th: 'บ้านน้ำราด จ.สุราษฎร์ธานี',
    region_en: 'Southern Rainforest',
    region_sv: 'Södra regnskogen',
    region_th: 'ป่าฝนภาคใต้',
    desc_en: 'Canoeing and swimming in natural freshwater springs surrounded by lush tropical rainforest.',
    desc_sv: 'Paddla kanot i kristallklart sötvatten omgiven av grönskande tropisk djungel och regnskog.',
    desc_th: 'พายเรือในธารน้ำใสแจ๋วเหมือนกระจกท่ามกลางป่าฝนธรรมชาติอันอุดมสมบูรณ์',
  },
  {
    episodeNumber: 8,
    id: 'XFTLRWvPS0s',
    title_en: 'What We Found on Thailand’s Rayong & Chanthaburi Coast',
    title_sv: 'Östkusten: Fruktodlingar och vackra stränder i Rayong & Chanthaburi',
    title_th: 'ชายฝั่งระยองและจันทบุรี: สวนผลไม้ ชุมชนริมน้ำ และหาดสงบ',
    location_en: 'Rayong & Chanthaburi',
    location_sv: 'Rayong & Chanthaburi',
    location_th: 'ระยอง - จันทบุรี',
    region_en: 'Eastern Gulf Coast',
    region_sv: 'Östra golfkusten',
    region_th: 'ชายฝั่งภาคตะวันออก',
    desc_en: 'Tasting tropical fruits in lush orchards, exploring historic gem markets, and quiet eastern beaches.',
    desc_sv: 'Smaka på tropiska frukter i fruktträdgårdar, besök gamla ädelstensmarknader och lugna kuster.',
    desc_th: 'ชิมผลไม้สดจากสวน เดินเล่นริมน้ำจันทบูร ตลาดพลอย และพักผ่อนชายหาดตะวันออก',
  },
  {
    episodeNumber: 9,
    id: '_sWeq2pMRRU',
    title_en: 'Old Bangkok: Riverside Temples & Yaowarat at Night',
    title_sv: 'Gamla Bangkok: Tempel vid floden & Chinatown på kvällen',
    title_th: 'กรุงเทพเก่า: วัดริมเจ้าพระยา และเยาวราชยามค่ำคืน',
    location_en: 'Bangkok (Chao Phraya & Yaowarat)',
    location_sv: 'Bangkok (Floden & Chinatown)',
    location_th: 'กรุงเทพฯ (เจ้าพระยาและเยาวราช)',
    region_en: 'Central Bangkok',
    region_sv: 'Centrala Bangkok',
    region_th: 'กรุงเทพมหานคร',
    desc_en: 'Cruising on Chao Phraya river express boats, visiting historic riverside temples, and Chinatown street food.',
    desc_sv: 'Åk båt på Chao Phraya-floden, besök gyllene tempel och upplev den livliga matmarknaden i Chinatown.',
    desc_th: 'นั่งเรือด่วนเจ้าพระยา ชมวัดอรุณ และชิมของอร่อยตลาดกลางคืนเยาวราช',
  },
  {
    episodeNumber: 10,
    id: 'XBPZcK9w59Y',
    title_en: 'We Almost Skipped Phetchabun, We\'re So Glad We Didn\'t',
    title_sv: 'Phetchabun & Khao Kho: Dimhöljda berg och det magiska mosaiktemplet',
    title_th: 'เพชรบูรณ์และเขาค้อ: ทะเลหมอกและวัดผาซ่อนแก้ว',
    location_en: 'Phetchabun & Khao Kho',
    location_sv: 'Phetchabun & Khao Kho',
    location_th: 'เพชรบูรณ์และเขาค้อ',
    region_en: 'Lower North / Isan Gate',
    region_sv: 'Norra bergstrakterna',
    region_th: 'ภาคเหนือตอนล่าง / ประตูสู่อีสาน',
    desc_en: 'High mountain vistas, clouds of mist, cool climate strawberry farms, and Wat Pha Sorn Kaew mosaic temple.',
    desc_sv: 'Kyliga bergstoppar med hav av dimma, jordgubbsodlingar och det fantastiska templet Wat Pha Sorn Kaew.',
    desc_th: 'สัมผัสลมหนาวและทะเลหมอกเขาค้อ ชมความงามวัดพระธาตุผาซ่อนแก้วที่ประดับด้วยกระเบื้องโมเสก',
  },
  {
    episodeNumber: 11,
    id: '566Z7kfSvZ4',
    title_en: 'We Found Alpine Wilderness at Phu Soi Dao, Thailand',
    title_sv: 'Phu Soi Dao: Vandring bland höghöjdsskogar och vattenfall',
    title_th: 'ภูสอยดาว: เดินป่าลานสนสามใบและแดนธรรมชาติบริสุทธิ์',
    location_en: 'Phu Soi Dao National Park',
    location_sv: 'Phu Soi Dao Nationalpark',
    location_th: 'อุทยานแห่งชาติภูสอยดาว',
    region_en: 'Northern Border Highlands',
    region_sv: 'Norra bergsmassiven',
    region_th: 'ยอดเขาสูงภาคเหนือ',
    desc_en: 'Hiking through pine forests up to the alpine plateau, mountain wildflowers, waterfalls, and outdoor adventure.',
    desc_sv: 'Vandra upp till den höga tallplatån, se vilda bergsblommor, vattenfall och ren orörd vildmark.',
    desc_th: 'พิชิตลานสนสามใบ ทุ่งดอกหงอนนาค และผจญภัยในธรรมชาติอันสมบูรณ์ของยอดเขาภูสอยดาว',
  },
];

export function DiscoverThailandView() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<VideoEpisode>(THAILAND_EPISODES[0]);
  const playerRef = useRef<HTMLDivElement>(null);

  const getTitle = (ep: VideoEpisode) => {
    if (locale === 'th') return ep.title_th;
    if (locale === 'sv') return ep.title_sv;
    return ep.title_en;
  };

  const getLocation = (ep: VideoEpisode) => {
    if (locale === 'th') return ep.location_th;
    if (locale === 'sv') return ep.location_sv;
    return ep.location_en;
  };

  const getDesc = (ep: VideoEpisode) => {
    if (locale === 'th') return ep.desc_th;
    if (locale === 'sv') return ep.desc_sv;
    return ep.desc_en;
  };

  const handleSelectEpisode = (ep: VideoEpisode) => {
    setSelectedVideo(ep);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentIndex = THAILAND_EPISODES.findIndex((e) => e.id === selectedVideo.id);
  const prevEpisode = currentIndex > 0 ? THAILAND_EPISODES[currentIndex - 1] : null;
  const nextEpisode = currentIndex < THAILAND_EPISODES.length - 1 ? THAILAND_EPISODES[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Header / Navigation */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === 'sv' ? 'Tillbaka till översikten' : locale === 'th' ? 'กลับหน้าหลัก' : 'Back to Dashboard'}
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded-full border border-sky-500/20">
              <Compass className="w-3.5 h-3.5" />
              {locale === 'sv' ? 'Upptäck Thailand' : locale === 'th' ? 'ค้นพบเมืองไทย' : 'Discover Thailand'}
            </span>
            <a
              href="https://www.youtube.com/@TouchGrassTour"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Touch Grass Tour</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Main Video Theater Player Section */}
        <div ref={playerRef} className="scroll-mt-16 mb-8">
          <div className="bg-card rounded-2xl overflow-hidden shadow-xl border border-border">
            {/* Embedded YouTube Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                key={selectedVideo.id}
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={getTitle(selectedVideo)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Video Info Bar */}
            <div className="p-5 sm:p-6 bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                    {locale === 'sv'
                      ? `Avsnitt ${selectedVideo.episodeNumber} av 11`
                      : locale === 'th'
                      ? `ตอนที่ ${selectedVideo.episodeNumber} จาก 11`
                      : `Episode ${selectedVideo.episodeNumber} of 11`}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {getLocation(selectedVideo)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    {locale === 'sv' ? 'Öppna på YouTube' : locale === 'th' ? 'ดูบน YouTube' : 'Watch on YouTube'}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
                {getTitle(selectedVideo)}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                {getDesc(selectedVideo)}
              </p>

              {/* Prev / Next Video Quick Controls */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                {prevEpisode ? (
                  <button
                    onClick={() => handleSelectEpisode(prevEpisode)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {locale === 'sv' ? 'Föregående:' : locale === 'th' ? 'ตอนก่อนหน้า:' : 'Previous:'}{' '}
                    </span>
                    <span className="truncate max-w-[160px] sm:max-w-[240px]">
                      {prevEpisode.episodeNumber}. {getTitle(prevEpisode)}
                    </span>
                  </button>
                ) : (
                  <div />
                )}

                {nextEpisode ? (
                  <button
                    onClick={() => handleSelectEpisode(nextEpisode)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-colors px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20"
                  >
                    <span className="hidden sm:inline">
                      {locale === 'sv' ? 'Nästa avsnitt:' : locale === 'th' ? 'ตอนถัดไป:' : 'Next Episode:'}{' '}
                    </span>
                    <span className="truncate max-w-[160px] sm:max-w-[240px]">
                      {nextEpisode.episodeNumber}. {getTitle(nextEpisode)}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Timeline Playlist Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Tv className="w-5 h-5 text-sky-500" />
              {locale === 'sv'
                ? 'Alla avsnitt i tidslinje (1–11)'
                : locale === 'th'
                ? 'วิดีโอทั้งหมดตามลำดับเวลา (1–11)'
                : 'All Episodes in Timeline Order (1–11)'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {locale === 'sv'
                ? 'Klicka på ett avsnitt för att starta videon direkt!'
                : locale === 'th'
                ? 'คลิกที่วิดีโอเพื่อเปิดดูได้ทันที'
                : 'Click any episode to start watching instantly!'}
            </p>
          </div>

          <span className="text-xs font-bold text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
            11 {locale === 'sv' ? 'avsnitt' : locale === 'th' ? 'ตอน' : 'episodes'}
          </span>
        </div>

        {/* YouTube-Style Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {THAILAND_EPISODES.map((episode) => {
            const isCurrent = selectedVideo.id === episode.id;
            return (
              <motion.div
                key={episode.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelectEpisode(episode)}
                className={`group cursor-pointer rounded-xl overflow-hidden bg-card border transition-all duration-200 flex flex-col ${
                  isCurrent
                    ? 'ring-2 ring-sky-500 border-sky-500 shadow-md shadow-sky-500/10'
                    : 'border-border hover:border-sky-500/50 hover:shadow-lg'
                }`}
              >
                {/* 16:9 Thumbnail Container */}
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${episode.id}/hqdefault.jpg`}
                    alt={getTitle(episode)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark overlay with play button on hover */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 ${
                        isCurrent
                          ? 'bg-sky-500 text-white scale-110 shadow-lg'
                          : 'bg-black/70 group-hover:bg-red-600 text-white group-hover:scale-110'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Episode badge top-left */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide">
                    Ep {episode.episodeNumber}
                  </div>

                  {/* Now playing indicator */}
                  {isCurrent && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {locale === 'sv' ? 'Spelar nu' : locale === 'th' ? 'กำลังเล่น' : 'Now Playing'}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{getLocation(episode)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {getTitle(episode)}
                    </h3>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {getDesc(episode)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
