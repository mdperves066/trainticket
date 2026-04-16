"use client";
import { useEffect, useState } from "react";
import TrainCard from './TrainCard';
import { FaSearch } from 'react-icons/fa';
import { useRouter } from "next/navigation";
export default function TrainDetails() {

    const router = useRouter();
    const [trains, setTrains] = useState<any[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(()=>{

        let token = localStorage.getItem("token") ?? "";
        if (!token) {
            router.push("/signin")
        }

    })

    useEffect(() => {
        async function fetchTrains() {
            const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
            const response = await fetch(`${ENDPOINT}/train/all`, {
                method: 'GET',
                headers: {
                    'Authorization': localStorage.getItem("token") ?? "",
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            setTrains(data);
        }
        fetchTrains();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const filteredTrains = trains.filter(train =>
        train.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white min-h-screen">
            <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by train name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-xl"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--sec-bg)]" />
                </div>
            </div>
            {filteredTrains.map(train => (
                <TrainCard
                    key={train.id}
                    train={train}
                    isExpanded={expandedCard === train.id}
                    onToggleExpand={() => toggleExpand(train.id)}
                />
            ))}
        </div>
    );
}