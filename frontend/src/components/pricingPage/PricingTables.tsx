import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { StripeProduct } from "../../pages/PricingPage";

interface Props {
  monthly: boolean;
  redirectToCheckout: (item: StripeProduct) => void;
}

function PricingTables({ monthly, redirectToCheckout }: Props) {
  return (
    <div className="px-2 flex flex-col items-center md:items-start md:flex-row md:justify-center md:space-x-6 lg:space-x-12">
      <div className="flex flex-col w-full relative my-2 px-4 h-full py-4 text-lg rounded-md max-w-md -2 bg-white shadow-md border-[#22c55e]">
        <div className={`ribbon ribbon-top-right ${monthly && "hidden"} `}>
          <span className="bg-[#38bdf8]">save 16€</span>
        </div>

        <div className="flex w-fit rounded-md bg-[#38bdf8] text-xs px-2 py-1 font-roboto text-black">
          ACCESS
        </div>
        <h2 className="font-robotoSlap text-3xl font-bold text-center my-2">
          Phaero Access
        </h2>
        <p className="mt-5">
          Gain access to all Phaero has to offer at the moment.
        </p>
        <div className="flex items-center my-6">
          <p className="font-spectral text-5xl ">
            {monthly ? "7.99 €" : "80 €"}
          </p>
          <p className="w-14 leading-tight text-sm ml-4 ">
            {monthly ? "per month" : "per year"}
          </p>
        </div>
        <div className="space-y-2">
          <p>This includes:</p>
          <ul className="text-base space-y-4 ml-2">
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Effortlessly monitor key health aspects</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Simplify data entry and record keeping</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p> Gain data-driven lifestyle recommendations</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Track all important metrics</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>2 times 120 seconds of audio transcription per day</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Up to 250 words long daily note</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Analyze 5 extra behaviours with our checklist</p>
            </li>
          </ul>
        </div>
        <div
          onClick={() => {
            redirectToCheckout({
              plan: monthly ? "monthly" : "yearly",
              name: "Phaero Access",
            });
          }}
          className="flex justify-center mt-8 cursor-pointer rounded-md py-1 transition-colors duration-150 hover:bg-[#e8e8e8] w-full border-2 border-[#38bdf8] font-robotoSlap"
        >
          Subscribe
        </div>
      </div>
      {/* second tier */}
      <div className="w-full flex flex-col relative my-2 px-4 h-full py-4 text-lg rounded-md max-w-md -2 bg-white shadow-md border-[#22c55e]">
        <div className={`ribbon ribbon-top-right ${monthly && "hidden"} `}>
          <span className="bg-[#22c55e]">save 30€</span>
        </div>
        <div className="flex w-fit rounded-md bg-[#22c55e] text-xs px-2 py-1 font-roboto text-black">
          PREMIUM
        </div>
        <h2 className="font-robotoSlap text-3xl font-bold text-center my-2">
          Phaero Premium
        </h2>
        <p className="mt-5">
          Get more out of Phaero and support its future development.
        </p>
        <div className="flex items-center my-6">
          <p className="font-spectral text-5xl ">
            {monthly ? "14.99 €" : "150 €"}
          </p>
          <p className="w-14 leading-tight text-sm ml-4">
            {monthly ? "per month" : "per year"}
          </p>
        </div>
        <div className="space-y-2">
          <p>This includes:</p>
          <ul className="text-base space-y-4 ml-2">
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Effortlessly monitor key health aspects</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Simplify data entry and record keeping</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Gain data-driven lifestyle recommendations</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Track all important metrics</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>4 times 240 seconds of audio transcription per day</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>
                Up to 500 word long daily note for improved feedback accuracy
              </p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Analyze 10 extra behaviours with our checklist</p>
            </li>
            <li className="flex space-x-2">
              <FontAwesomeIcon
                icon={faCheck}
                size="lg"
                style={{ color: "#22c55e" }}
              />
              <p>Support us and Phaero</p>
            </li>
          </ul>
        </div>
        <div
          onClick={() => {
            redirectToCheckout({
              name: "Phaero Premium",
              plan: monthly ? "monthly" : "yearly",
            });
          }}
          className="flex justify-center mt-8 cursor-pointer rounded-md py-1 transition-colors duration-150 hover:bg-[#e8e8e8] w-full border-2 border-[#38bdf8] font-robotoSlap"
        >
          Subscribe
        </div>
      </div>
    </div>
  );
}
export default PricingTables;
