"use client";
import { useEffect, useState } from "react";
import PlaceCard from './PlaceCard';
import { FaSearch } from 'react-icons/fa';
import { useRouter } from "next/navigation";

export default function RouteDetails() {

    const router = useRouter();
    const [places, setPlaces] = useState<any[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");


    useEffect(()=>{

        let token = localStorage.getItem("token") ?? "";
        if (!token) {
            router.push("/signin")
        }

    })

    useEffect(() => {
        async function fetchPlaces() {
            const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
            const response = await fetch(`${ENDPOINT}/place/all`, {
                method: 'GET',
                headers: {
                    'Authorization': localStorage.getItem("token") ?? "",
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            setPlaces(data);
            console.log(places)
        }
        fetchPlaces();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const filteredPlaces = places.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white min-h-screen">
            <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by place name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-xl"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--sec-bg)]" />
                </div>
            </div>
            {filteredPlaces.map(place => (
                <PlaceCard
                    key={place.id}
                    place={place}
                    isExpanded={expandedCard === place.id}
                    onToggleExpand={() => toggleExpand(place.id)}
                />
            ))}
        </div>
    );
}