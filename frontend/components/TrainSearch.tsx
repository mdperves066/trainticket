"use client"
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import TrainSearchCard from "./TrainSearchCard";
import { Button } from "./ui/button";
export default function TrainSearch() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    const [searchQuery, setSearchQuery] = useState("");
    const [trains, setTrains] = useState<any[]>([]);


    useEffect(() => {
        async function fetchTrains() {
        
            const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
            const response = await fetch(`${ENDPOINT}/path/${from}/${to}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            setTrains(data);
        }

        if (from && to) {
            fetchTrains();
        }
    }, []);

    

    const filteredTrains = trains.filter(train =>
        train.train_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                <TrainSearchCard
                    key={train.id}
                    train={train}
                    date = {date}
                />
            ))}
            {
                filteredTrains.length === 0 && (
                    <div className="flex flex-col justify-center items-center">
                        <h1 className="text-xl text-center text-gray-500 p-4 m-3">No trains found</h1>
                        <Button className="bg-red-600 p-4 text-xl m-4" onClick={() => router.push("/book_tickets")}>Go back</Button>
                    </div>
                )

            }
        </div>
    );




};
