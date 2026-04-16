"use client"

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import SearchSeatCard from "./SearchSeatCard";
import SearchTrainRouteGraph from "./SearchTrainRouteGraph";

export default function TrainSearchCard({ train, date }: any) {

    const [isSeat, setIsSeat] = useState(false);
    const [isRoute, setIsRoute] = useState(false);
    const [seats, setSeats] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const onToggleExpand = () => {
        if (isExpanded) setIsExpanded(false);
        else setIsExpanded(true);
    }

        async function fetchAvailableSeats() {
            const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
            const response = await fetch(`${ENDPOINT}/booking/train/${train.train_id}/available/seats?date=${date}&dflag=${train.dflag}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            setSeats(data);
        }

        useEffect(() => {
            fetchAvailableSeats();
        }, [isSeat]);

        return (
            <>
                {
                    seats.length > 0 && (
                        <div className="bg-[var(--p-bg)] border-2 shadow-lg flex justify-between items-center rounded-lg m-5">
                            <h2 className="text-[var(--sec-bg)] text-lg md:text-2xl font-semibold tracking-wider p-3 m-5 text-nowrap">{train.train_name}</h2>
                            <button className="text-xl text-[var(--sec-bg)] p-3 m-5" onClick={onToggleExpand}>
                                {isExpanded ? '▲' : '▼'}
                            </button>
                        </div>
                    )
                }

                {isExpanded && (<div className="flex justify-center items-center">
                    <Button className="bg-blue-500 text-lg p-4 m-5" onClick={
                        () => {
                            if (isSeat) setIsSeat(false);
                            else {
                                setIsSeat(true);
                            }
                        }
                    }>Book Seats</Button>
                    <Button className="bg-orange-700 text-lg p-4 m-5" onClick={() => {
                        if (isRoute) setIsRoute(false);
                        else setIsRoute(true);
                    }}>Show Routes</Button>
                </div>
                )
                }

                {
                   isExpanded && isSeat && seats.length > 0 && (
                        <div className="flex justify-evenly items-center overflow-x-auto whitespace-nowrap mb-8">
                            {
                                seats.map((seat: any) => (
                                    seat.available > 0 && (
                                        <SearchSeatCard key={seat.id} seat={seat} date={date} path={train.path} dflag={train.dflag} />
                                    )
                                ))
                            }
                        </div>
                    )
                }
                {
                   isExpanded && isRoute && (
                        <div>
                            <SearchTrainRouteGraph path={train.path} />
                        </div>
                    )
                }
            </>
        )
    }