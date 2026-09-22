"""
Station Normalization & Canonicalization Layer.
Resolves arbitrary user input (English, Bengali, abbreviations, aliases, Kamalapur, etc.)
to the official Bangladesh Railway canonical station names.
"""

import unicodedata
import re
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field


@dataclass
class CanonicalStation:
    code: str
    canonical_name: str
    display_name: str
    bangla_name: str
    aliases: List[str] = field(default_factory=list)


# Official Bangladesh Railway Intercity Station Catalog
OFFICIAL_STATIONS: List[CanonicalStation] = [
    CanonicalStation(
        code="DA",
        canonical_name="DHAKA",
        display_name="Dhaka (Kamalapur)",
        bangla_name="ঢাকা (কমলাপুর)",
        aliases=["dhaka", "kamalapur", "dhaka kamalapur", "biman bandar", "airport", "cantonment", "ঢাকা", "কমলাপুর", "বিমান বন্দর"],
    ),
    CanonicalStation(
        code="CG",
        canonical_name="CHITTAGONG",
        display_name="Chittagong (Chattogram)",
        bangla_name="চট্টগ্রাম",
        aliases=["chittagong", "chattogram", "ctg", "pahartali", "চট্টগ্রাম", "চিটাগং"],
    ),
    CanonicalStation(
        code="SY",
        canonical_name="SYLHET",
        display_name="Sylhet",
        bangla_name="সিলেট",
        aliases=["sylhet", "shilchar", "সিলেট", "মাইজগাঁও"],
    ),
    CanonicalStation(
        code="CXB",
        canonical_name="COX'S BAZAR",
        display_name="Cox's Bazar",
        bangla_name="কক্সবাজার",
        aliases=["cox's bazar", "coxs bazar", "coxsbazar", "cox bazar", "cxb", "কক্সবাজার"],
    ),
    CanonicalStation(
        code="RJ",
        canonical_name="RAJSHAHI",
        display_name="Rajshahi",
        bangla_name="রাজশাহী",
        aliases=["rajshahi", "raj", "রাজশাহী"],
    ),
    CanonicalStation(
        code="KL",
        canonical_name="KHULNA",
        display_name="Khulna",
        bangla_name="খুলনা",
        aliases=["khulna", "daulatpur", "খুলনা"],
    ),
    CanonicalStation(
        code="RP",
        canonical_name="RANGPUR",
        display_name="Rangpur",
        bangla_name="রংপুর",
        aliases=["rangpur", "রংপুর"],
    ),
    CanonicalStation(
        code="DN",
        canonical_name="DINAJPUR",
        display_name="Dinajpur",
        bangla_name="দিনাজপুর",
        aliases=["dinajpur", "দিনাজপুর"],
    ),
    CanonicalStation(
        code="MY",
        canonical_name="MYMENSINGH",
        display_name="Mymensingh",
        bangla_name="ময়মনসিংহ",
        aliases=["mymensingh", "mym", "ময়মনসিংহ"],
    ),
    CanonicalStation(
        code="CM",
        canonical_name="COMILLA",
        display_name="Comilla (Cumilla)",
        bangla_name="কুমিল্লা",
        aliases=["comilla", "cumilla", "কুমিল্লা"],
    ),
    CanonicalStation(
        code="BB",
        canonical_name="BRAHMANBARIA",
        display_name="Brahmanbaria",
        bangla_name="ব্রাহ্মণবাড়িয়া",
        aliases=["brahmanbaria", "b.baria", "bbaria", "ব্রাহ্মণবাড়িয়া", "বিবাড়িয়া"],
    ),
    CanonicalStation(
        code="FN",
        canonical_name="FENI",
        display_name="Feni",
        bangla_name="ফেনী",
        aliases=["feni", "ফেনী"],
    ),
    CanonicalStation(
        code="BG",
        canonical_name="BOGRA",
        display_name="Bogra (Bogura)",
        bangla_name="বগুড়া",
        aliases=["bogra", "bogura", "বগুড়া"],
    ),
    CanonicalStation(
        code="ST",
        canonical_name="SANTAHAR",
        display_name="Santahar",
        bangla_name="সান্তাহার",
        aliases=["santahar", "সান্তাহার"],
    ),
    CanonicalStation(
        code="IS",
        canonical_name="ISHWARDI",
        display_name="Ishwardi (Ishurdi)",
        bangla_name="ঈশ্বরদী",
        aliases=["ishwardi", "ishurdi", "ঈশ্বরদী"],
    ),
    CanonicalStation(
        code="JS",
        canonical_name="JESSORE",
        display_name="Jessore (Jashore)",
        bangla_name="যশোর",
        aliases=["jessore", "jashore", "যশোর"],
    ),
    CanonicalStation(
        code="JM",
        canonical_name="JAMALPUR",
        display_name="Jamalpur",
        bangla_name="জামালপুর",
        aliases=["jamalpur", "জামালপুর"],
    ),
    CanonicalStation(
        code="KG",
        canonical_name="KISHOREGANJ",
        display_name="Kishoreganj",
        bangla_name="কিশোরগঞ্জ",
        aliases=["kishoreganj", "কিশোরগঞ্জ"],
    ),
    CanonicalStation(
        code="NT",
        canonical_name="NATORE",
        display_name="Natore",
        bangla_name="নাটোর",
        aliases=["natore", "নাটোর"],
    ),
    CanonicalStation(
        code="SJ",
        canonical_name="SIRAJGANJ",
        display_name="Sirajganj",
        bangla_name="সিরাজগঞ্জ",
        aliases=["sirajganj", "সিরাজগঞ্জ", "মনসুর আলী"],
    ),
    CanonicalStation(
        code="TG",
        canonical_name="TANGAIL",
        display_name="Tangail",
        bangla_name="টাঙ্গাইল",
        aliases=["tangail", "টাঙ্গাইল", "ঘারিন্দা"],
    ),
    CanonicalStation(
        code="PB",
        canonical_name="PARBATIPUR",
        display_name="Parbatipur",
        bangla_name="পার্বতীপুর",
        aliases=["parbatipur", "পার্বতীপুর"],
    ),
    CanonicalStation(
        code="KS",
        canonical_name="KUSHTIA",
        display_name="Kushtia (Poradaha)",
        bangla_name="কুষ্টিয়া (পোড়াদহ)",
        aliases=["kushtia", "poradaha", "কুষ্টিয়া", "পোড়াদহ"],
    ),
    CanonicalStation(
        code="CD",
        canonical_name="CHUADANGA",
        display_name="Chuadanga",
        bangla_name="চুয়াডাঙ্গা",
        aliases=["chuadanga", "চুয়াডাঙ্গা"],
    ),
    CanonicalStation(
        code="LM",
        canonical_name="LALMONIRHAT",
        display_name="Lalmonirhat",
        bangla_name="লালমনিরহাট",
        aliases=["lalmonirhat", "লালমনিরহাট"],
    ),
    CanonicalStation(
        code="NK",
        canonical_name="NETROKONA",
        display_name="Netrokona",
        bangla_name="নেত্রকোনা",
        aliases=["netrokona", "নেত্রকোনা"],
    ),
    CanonicalStation(
        code="CP",
        canonical_name="CHANDPUR",
        display_name="Chandpur",
        bangla_name="চাঁদপুর",
        aliases=["chandpur", "চাঁদপুর"],
    ),
    CanonicalStation(
        code="NO",
        canonical_name="NOAKHALI",
        display_name="Noakhali",
        bangla_name="নোয়াখালী",
        aliases=["noakhali", "নোয়াখালী", "মাইজদী"],
    ),
    CanonicalStation(
        code="BP",
        canonical_name="BENAPOLE",
        display_name="Benapole",
        bangla_name="বেনাপোল",
        aliases=["benapole", "বেনাপোল"],
    ),
    CanonicalStation(
        code="PC",
        canonical_name="PANCHAGARH",
        display_name="Panchagarh",
        bangla_name="পঞ্চগড়",
        aliases=["panchagarh", "পঞ্চগড়"],
    ),
    CanonicalStation(
        code="CH",
        canonical_name="CHILAHATI",
        display_name="Chilahati",
        bangla_name="চিলাহাটি",
        aliases=["chilahati", "চিলাহাটি"],
    ),
    CanonicalStation(
        code="KG",
        canonical_name="KURIGRAM",
        display_name="Kurigram",
        bangla_name="কুড়িগ্রাম",
        aliases=["kurigram", "কুড়িগ্রাম"],
    ),
    CanonicalStation(
        code="BH",
        canonical_name="BHANGA",
        display_name="Bhanga (Padma Bridge)",
        bangla_name="ভাঙ্গা (পদ্মা সেতু)",
        aliases=["bhanga", "padma", "ভাঙ্গা", "পদ্মা"],
    ),
]


def _normalize_string(text: str) -> str:
    """Normalize Unicode, strip punctuation, trim whitespace, and lowercase."""
    if not text:
        return ""
    # Unicode NFKC normalization
    nfkc_text = unicodedata.normalize("NFKC", text.strip())
    # Remove special punctuation like quotes, commas, dots
    cleaned = re.sub(r"['\",\.\-_]", " ", nfkc_text)
    # Collapse multiple whitespaces
    return " ".join(cleaned.lower().split())


CANONICAL_STATIONS: List[str] = [s.canonical_name for s in OFFICIAL_STATIONS]


def resolve_station(user_input: str) -> Optional[CanonicalStation]:
    """
    Resolve user input to the official canonical station.
    Matches exact canonical name, display name, bangla name, or any alias.
    """
    if not user_input or not user_input.strip():
        return None

    normalized_input = _normalize_string(user_input)

    # 1. Exact match on canonical_name
    for station in OFFICIAL_STATIONS:
        if _normalize_string(station.canonical_name) == normalized_input:
            return station

    # 2. Match aliases
    for station in OFFICIAL_STATIONS:
        for alias in station.aliases:
            if _normalize_string(alias) == normalized_input:
                return station

    # 3. Match display name or bangla name
    for station in OFFICIAL_STATIONS:
        if _normalize_string(station.display_name) == normalized_input or _normalize_string(station.bangla_name) == normalized_input:
            return station

    # 4. Substring / Prefix match
    for station in OFFICIAL_STATIONS:
        norm_canonical = _normalize_string(station.canonical_name)
        if norm_canonical.startswith(normalized_input) or normalized_input in norm_canonical:
            return station
        for alias in station.aliases:
            norm_alias = _normalize_string(alias)
            if norm_alias.startswith(normalized_input) or (len(normalized_input) >= 3 and normalized_input in norm_alias):
                return station

    return None


def resolve_canonical_station(user_input: str) -> str:
    """
    Convenience function returning the canonical station string name.
    Falls back to cleaned uppercase user input if uncatalogued.
    """
    if not user_input or not user_input.strip():
        return ""
    st = resolve_station(user_input)
    if st:
        return st.canonical_name
    return user_input.strip().upper()


def search_stations(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search stations by partial query in English or Bengali, returning structured dicts."""
    if not query or not query.strip():
        return [
            {
                "code": s.code,
                "canonical": s.canonical_name,
                "canonical_name": s.canonical_name,
                "display_name": s.display_name,
                "bangla_name": s.bangla_name,
            }
            for s in OFFICIAL_STATIONS[:limit]
        ]

    normalized_q = _normalize_string(query)
    matches: List[Dict[str, Any]] = []

    for station in OFFICIAL_STATIONS:
        # Check canonical, display, bangla, and aliases
        if normalized_q in _normalize_string(station.canonical_name) or \
           normalized_q in _normalize_string(station.display_name) or \
           normalized_q in _normalize_string(station.bangla_name) or \
           any(normalized_q in _normalize_string(a) for a in station.aliases):
            matches.append({
                "code": station.code,
                "canonical": station.canonical_name,
                "canonical_name": station.canonical_name,
                "display_name": station.display_name,
                "bangla_name": station.bangla_name,
            })
            if len(matches) >= limit:
                break

    return matches
