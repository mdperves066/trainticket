export default function Landing() {
    return (
        <div className="bg-[var(--p_bg)] w-full min-h-screen flex flex-col-reverse md:flex-row justify-center items-center m-auto">
            <div className="flex flex-col items-center justify-center m-20">
                <p className="tracking-wider text-nowrap text-2xl md:text-3xl lg:text-4xl text-[var(--sec-bg)] font-bold">
                    BD Railway E-Ticket Service
                </p>
                <p className="tracking-widest text-lg md:text-xl lg:text-2xl text-wrap  text-center p-4 text-gray-900">
                    Welcome to BD Railway's online ticket booking system. Book your train tickets easily and conveniently from anywhere. Enjoy a smooth and efficient booking experience with just a few clicks.
                </p>
            </div>
            <img src="/train_bg.jpeg" className="border-10 lg:w-[50%] md:w-[40%] sm:w-[50%] max-w-full h-auto overflow-clip"/>
        </div>
    )
}