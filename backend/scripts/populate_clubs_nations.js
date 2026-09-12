const pool = require('../src/db');

async function populateClubsAndNationalities() {
    console.log("⚽ Starting Database Population: Konami Licensed Partner Clubs & Nationalities...");
    try {
        // 1. Add logourl & flagurl columns if they don't exist
        await pool.query(`
            ALTER TABLE public.club ADD COLUMN IF NOT EXISTS logourl character varying;
            ALTER TABLE public.nationality ADD COLUMN IF NOT EXISTS flagurl character varying;
        `);

        // Ensure unique constraint on clubname for clean upserts
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'club_clubname_key'
                ) THEN
                    ALTER TABLE public.club ADD CONSTRAINT club_clubname_key UNIQUE (clubname);
                END IF;
            END $$;
        `);
        console.log("✅ Schema updated with logourl & flagurl columns and constraints.");

        // 2. Ensure Leagues Exist
        const leagues = [
            ['La Liga', 'Spain'],
            ['Premier League', 'England'],
            ['Bundesliga', 'Germany'],
            ['Ligue 1', 'France'],
            ['Serie A', 'Italy'],
            ['Eredivisie', 'Netherlands']
        ];
        for (const [leaguename, country] of leagues) {
            await pool.query(`
                INSERT INTO public.league (leaguename, country) 
                VALUES ($1, $2) ON CONFLICT (leaguename) DO NOTHING;
            `, [leaguename, country]);
        }

        // 3. Top Clubs & Official Konami Partner Clubs
        const clubsData = [
            // --- KONAMI OFFICIAL LICENSED PARTNER CLUBS ---
            { name: 'FC Barcelona', league: 'La Liga', logo: '/images/barcelona.svg' },
            { name: 'Bayern Munich', league: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/300px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
            { name: 'Manchester United', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/300px-Manchester_United_FC_crest.svg.png' },
            { name: 'AC Milan', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/AC_Milan_flag.svg/300px-AC_Milan_flag.svg.png' },
            { name: 'Inter Milan', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/300px-FC_Internazionale_Milano_2021.svg.png' },
            { name: 'Arsenal', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/300px-Arsenal_FC.svg.png' },
            { name: 'SS Lazio', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/SS_Lazio.svg/300px-SS_Lazio.svg.png' },
            { name: 'AS Roma', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/300px-AS_Roma_logo_%282017%29.svg.png' },
            { name: 'Atalanta', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/AtalantaBC.svg/300px-AtalantaBC.svg.png' },

            // --- ADDITIONAL WORLD TOP CLUBS ---
            { name: 'Real Madrid', league: 'La Liga', logo: '/images/real_madrid.svg' },
            { name: 'Paris Saint-Germain', league: 'Ligue 1', logo: '/images/psg.svg' },
            { name: 'Manchester City', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/300px-Manchester_City_FC_badge.svg.png' },
            { name: 'Liverpool', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/300px-Liverpool_FC.svg.png' },
            { name: 'Chelsea', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/300px-Chelsea_FC.svg.png' },
            { name: 'Juventus', league: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/300px-Juventus_FC_2017_icon_%28black%29.svg.png' },
            { name: 'Bayer Leverkusen', league: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/300px-Bayer_04_Leverkusen_logo.svg.png' },
            { name: 'Borussia Dortmund', league: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/300px-Borussia_Dortmund_logo.svg.png' },
            { name: 'Atletico Madrid', league: 'La Liga', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/300px-Atletico_Madrid_2017_logo.svg.png' },
            { name: 'Ajax', league: 'Eredivisie', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/79/Ajax_Amsterdam.svg/300px-Ajax_Amsterdam.svg.png' }
        ];

        for (const c of clubsData) {
            const leagueRes = await pool.query(`SELECT leagueid FROM public.league WHERE leaguename = $1 LIMIT 1;`, [c.league]);
            const leagueId = leagueRes.rows[0]?.leagueid || 1;

            await pool.query(`
                INSERT INTO public.club (clubname, leagueid, logourl)
                VALUES ($1, $2, $3)
                ON CONFLICT (clubname) DO UPDATE SET logourl = EXCLUDED.logourl, leagueid = EXCLUDED.leagueid;
            `, [c.name, leagueId, c.logo]);
        }
        console.log(`✅ ${clubsData.length} Clubs populated/updated with official logos!`);

        // 4. Nationalities with Flag URLs
        const nationalitiesData = [
            { name: 'France', flag: 'https://flagcdn.com/w40/fr.png' },
            { name: 'Argentina', flag: 'https://flagcdn.com/w40/ar.png' },
            { name: 'Brazil', flag: 'https://flagcdn.com/w40/br.png' },
            { name: 'England', flag: 'https://flagcdn.com/w40/gb-eng.png' },
            { name: 'Germany', flag: 'https://flagcdn.com/w40/de.png' },
            { name: 'Spain', flag: 'https://flagcdn.com/w40/es.png' },
            { name: 'Portugal', flag: 'https://flagcdn.com/w40/pt.png' },
            { name: 'Italy', flag: 'https://flagcdn.com/w40/it.png' },
            { name: 'Netherlands', flag: 'https://flagcdn.com/w40/nl.png' },
            { name: 'Belgium', flag: 'https://flagcdn.com/w40/be.png' },
            { name: 'Uruguay', flag: 'https://flagcdn.com/w40/uy.png' },
            { name: 'Croatia', flag: 'https://flagcdn.com/w40/hr.png' },
            { name: 'Japan', flag: 'https://flagcdn.com/w40/jp.png' },
            { name: 'South Korea', flag: 'https://flagcdn.com/w40/kr.png' },
            { name: 'Morocco', flag: 'https://flagcdn.com/w40/ma.png' },
            { name: 'Senegal', flag: 'https://flagcdn.com/w40/sn.png' },
            { name: 'Egypt', flag: 'https://flagcdn.com/w40/eg.png' },
            { name: 'Norway', flag: 'https://flagcdn.com/w40/no.png' },
            { name: 'Poland', flag: 'https://flagcdn.com/w40/pl.png' },
            { name: 'Colombia', flag: 'https://flagcdn.com/w40/co.png' },
            { name: 'United States', flag: 'https://flagcdn.com/w40/us.png' }
        ];

        for (const n of nationalitiesData) {
            await pool.query(`
                INSERT INTO public.nationality (countryname, flagurl)
                VALUES ($1, $2)
                ON CONFLICT (countryname) DO UPDATE SET flagurl = EXCLUDED.flagurl;
            `, [n.name, n.flag]);
        }
        console.log(`✅ ${nationalitiesData.length} Nationalities populated/updated with flag URLs!`);

        console.log("🎉 Database population completed successfully!");
    } catch (err) {
        console.error("❌ Error populating database:", err);
    } finally {
        await pool.end();
    }
}

populateClubsAndNationalities();
