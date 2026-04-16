"use client"
import { useEffect } from 'react';
import loader from "@/lottie/train_loader.json";
import { useLottie} from 'lottie-react';

export default function LoadingComponent() {
    const options = {
        animationData: loader,
        loop: false,
    };

    const { View, animationItem } = useLottie(options);

    useEffect(() => {
        const interval = setInterval(() => {
            if (animationItem) {
                clearInterval(interval);

                const handleComplete = () => {
                    const startFrame = 150;
                    const endFrame = 230;
                    animationItem.playSegments([startFrame, endFrame], true);
                };
                
                animationItem.setSpeed(1.5);
                animationItem.play();

                if (animationItem.addEventListener) {
                    animationItem.addEventListener('complete', handleComplete);
                } 

                return () => {
                    if (animationItem.removeEventListener) {
                        animationItem.removeEventListener('complete', handleComplete);
                    } 
                };
            } 
        }, 100);

        return () => clearInterval(interval);
    }, [animationItem]);

    return (
        <div className="w-full h-screen flex justify-center items-center">
            <div className='relative w-[60%] md:w-[30%] h-[80%] md:h-[30%]'>
                <div className='absolute inset-0 flex justify-center items-center'>
                    {View}
                </div>
            </div>
        </div>
    );
}