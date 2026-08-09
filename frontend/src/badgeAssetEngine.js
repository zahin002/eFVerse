// Dynamic Badge & Image Asset Engine for eFVerse (Local Public SVG + DB URLs + CDN Fallbacks)

export const getCountryFlagUrl = (countryName, customFlagUrl) => {
    if (customFlagUrl && (customFlagUrl.startsWith('http') || customFlagUrl.startsWith('/'))) return customFlagUrl;
    if (!countryName) return 'https://flagcdn.com/w40/un.png';
    const name = countryName.toString().toLowerCase().trim();

    const isoMap = {
        'france': 'fr', 'argentina': 'ar', 'brazil': 'br', 'england': 'gb-eng',
        'germany': 'de', 'spain': 'es', 'portugal': 'pt', 'italy': 'it',
        'netherlands': 'nl', 'belgium': 'be', 'croatia': 'hr', 'uruguay': 'uy',
        'egypt': 'eg', 'senegal': 'sn', 'japan': 'jp', 'south korea': 'kr',
        'korea': 'kr', 'norway': 'no', 'poland': 'pl', 'nigeria': 'ng',
        'ghana': 'gh', 'colombia': 'co', 'chile': 'cl', 'morocco': 'ma',
        'algeria': 'dz', 'ivory coast': 'ci', 'cameroon': 'cm', 'cameroun': 'cm',
        'united states': 'us', 'usa': 'us', 'mexico': 'mx', 'canada': 'ca',
        'sweden': 'se', 'denmark': 'dk', 'turkey': 'tr', 'serbia': 'rs',
        'switzerland': 'ch', 'austria': 'at', 'scotland': 'gb-sct', 'wales': 'gb-wls'
    };

    const code = isoMap[name] || (name.length === 2 ? name : 'un');
    return `https://flagcdn.com/w40/${code}.png`;
};

export const getTournamentBadgeUrl = (eventName, leagueName, cardType) => {
    const term = `${eventName || ''} ${leagueName || ''} ${cardType || ''}`.toLowerCase();

    if (term.includes('ucl') || term.includes('champions league') || term.includes('european cup')) {
        return '/images/ucl.svg';
    }
    return '/images/world_cup.svg';
};

export const getClubLogoUrl = (clubName, customLogoUrl) => {
    if (customLogoUrl && (customLogoUrl.startsWith('http') || customLogoUrl.startsWith('/'))) return customLogoUrl;
    if (!clubName) return '/images/real_madrid.svg';

    const name = clubName.toString().toLowerCase().trim();
    if (name.includes('real madrid') || name.includes('madrid')) {
        return '/images/real_madrid.svg';
    }
    if (name.includes('barcelona') || name.includes('barca')) {
        return '/images/barcelona.svg';
    }
    if (name.includes('psg') || name.includes('paris')) {
        return '/images/psg.svg';
    }
    if (name.includes('bayern')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/300px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png';
    }
    if (name.includes('manchester city') || name.includes('man city')) {
        return 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/300px-Manchester_City_FC_badge.svg.png';
    }
    if (name.includes('manchester united') || name.includes('man utd')) {
        return 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/300px-Manchester_United_FC_crest.svg.png';
    }
    if (name.includes('liverpool')) {
        return 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/300px-Liverpool_FC.svg.png';
    }
    if (name.includes('arsenal')) {
        return 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/300px-Arsenal_FC.svg.png';
    }
    if (name.includes('chelsea')) {
        return 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/300px-Chelsea_FC.svg.png';
    }
    if (name.includes('ac milan') || name.includes('milan')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/AC_Milan_flag.svg/300px-AC_Milan_flag.svg.png';
    }
    if (name.includes('inter') || name.includes('internazionale')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/300px-FC_Internazionale_Milano_2021.svg.png';
    }
    if (name.includes('juventus')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/300px-Juventus_FC_2017_icon_%28black%29.svg.png';
    }

    return '/images/club_default.svg';
};

export const getManagerPhotoUrl = (managerName) => {
    if (!managerName) return 'https://secure.gravatar.com/avatar/unknown?d=mp';
    const name = managerName.toLowerCase().trim();
    if (name.includes('deschamps')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/1446-1681723469.jpg?lm=1681723469';
    }
    if (name.includes('tuchel')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/7471-1682329241.jpg?lm=1682329241';
    }
    if (name.includes('martínez') || name.includes('martinez')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/4414-1662996969.jpg?lm=1662996969';
    }
    if (name.includes('cruyff') || name.includes('cruijff')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/4025-1449760775.jpg?lm=1449760775';
    }
    if (name.includes('beckenbauer')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/660-1704655938.jpg?lm=1704655938';
    }
    if (name.includes('alonso')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/60317-1698226065.jpg?lm=1698226065';
    }
    if (name.includes('klopp')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/118-1715011756.jpg?lm=1715011756';
    }
    if (name.includes('gattuso')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/252-1680521874.jpg?lm=1680521874';
    }
    if (name.includes('guardiola') || name.includes('pep')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/5672-1682329188.jpg?lm=1682329188';
    }
    if (name.includes('flick')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/293-1716989445.jpg?lm=1716989445';
    }
    if (name.includes('conte')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/2930-1717582455.jpg?lm=1717582455';
    }
    if (name.includes('ancelotti')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/663-1711364506.jpg?lm=1711364506';
    }
    if (name.includes('simeone')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/8834-1682329437.jpg?lm=1682329437';
    }
    if (name.includes('ten hag')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/3816-1682329328.jpg?lm=1682329328';
    }
    if (name.includes('arteta')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/47620-1682329210.jpg?lm=1682329210';
    }
    if (name.includes('mourinho')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/276-1705397442.jpg?lm=1705397442';
    }
    if (name.includes('zidane')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/24429-1614761405.jpg?lm=1614761405';
    }
    if (name.includes('nagelsmann')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/7425-1695376378.jpg?lm=1695376378';
    }
    if (name.includes('koeman')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/661-1678187847.jpg?lm=1678187847';
    }
    if (name.includes('kovac') || name.includes('kovač')) {
        return 'https://img.a.transfermarkt.technology/portrait/header/775-1653381655.jpg?lm=1653381655';
    }
    return 'https://secure.gravatar.com/avatar/unknown?d=mp';
};
