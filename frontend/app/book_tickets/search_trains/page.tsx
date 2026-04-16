import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import TrainSearch from "@/components/TrainSearch";
export default function page() {
    return (
        <div className="sticky min-h-screen flex flex-col">
            <NavBar signin={false} div={"bookTicket"} />
            <TrainSearch />
            <Footer />
        </div>
    )
};
