"use client"
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import SeatCard from './SeatCard';
import TrainRouteGraph from './TrainRouteGraph';
const TrainCard = ({ train, isExpanded, onToggleExpand }: any) => {
    const [seat, setSeat] = useState(false);
    const [path, setPath] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [dflag, setDflag] = useState(0);


    async function getRoutes() {
        const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
        const response = await fetch(`${ENDPOINT}/train/${train.id}/route?dflag=${dflag}`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem("token") ?? "",
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
       
        setRoutes(data.path);
    }

    useEffect(() => {
        getRoutes();
    }, [dflag]); 

    return (
        <div className="card">
            <div className="card-header">
                <div className="bg-[var(--p-bg)] border-2 shadow-lg flex justify-between items-center rounded-lg m-5">
                    <h2 className="text-[var(--sec-bg)] text-lg md:text-2xl font-semibold tracking-wider p-3 m-5 text-nowrap">{train.name}</h2>
                    <button className="text-xl text-[var(--sec-bg)] p-3 m-5" onClick={onToggleExpand}>
                        {isExpanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="card-body">
                    <div className="flex justify-center items-center">
                        <Button className="bg-[var(--sec-bg)] text-lg p-4 m-5" onClick={() => {
                            if (seat) setSeat(false);
                            else setSeat(true);
                        }}>Show Seats</Button>
                        <Button className="bg-orange-700 text-lg p-4 m-5" onClick={() => {
                            if (path) setPath(false);
                            else setPath(true);
                        }}>Show Routes</Button>
                    </div>

                    {seat && (
                        <div className="max-w-full flex justify-evenly items-center overflow-x-auto whitespace-nowrap mb-8">
                            {
                                train.seats.map((seat: any) => (
                                    <SeatCard key={seat.id} seat={seat} />
                                ))
                            }
                        </div>
                    )}

                    {
                        path && (
                            <div className="flex flex-col justify-center items-center">
                                <Button
                                    className={`${dflag === 0 ? 'bg-red-500' : 'bg-blue-500'} text-lg p-4 m-5`}
                                    onClick={() => { 
                                        setDflag(dflag === 0 ? 1 : 0) 
                                    }
                                    }
                                >
                                    {dflag === 0 ? "Outgoing" : "Incoming"}
                                </Button>
                                <TrainRouteGraph routes={routes} />
                                
                            </div>
                        )
                    }
                </div>

            )}
        </div>
    );
};

export default TrainCard;