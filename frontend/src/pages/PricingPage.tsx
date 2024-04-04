import { useState, useContext } from "react";
import { useApi } from "../modules/apiAxios";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import PricingTables from "../components/pricingPage/PricingTables";
import { useNavigate } from "react-router";
import { FancyToggleButton } from "../components/utils/Buttons";
import { Stripe, loadStripe } from "@stripe/stripe-js";
import HandleObjections from "../components/pricingPage/HandleObjections";
import { MapKeysContext } from "../components/contexts/MapKeysContext";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      "pk_live_51OMoAbGAO8EG5wGUXH88vnhxnOOC0QCq1fX1jHe2n2fD1ulDr82UjzGaxNNcOJNtC7s6ztMyaqagtC89rybFJEgI00i2c0rpjQ"
    );
  }
  return stripePromise;
};

export interface StripeProduct {
  name: "Phaero Premium" | "Phaero Access";
  plan: "monthly" | "yearly";
}

function PricingPage() {
  const [monthly, setMonthly] = useState(true);

  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);
  const navigate = useNavigate();
  const api = useApi();

  const redirectToCheckout = async (item: StripeProduct) => {
    const stripe = await getStripe();
    if (!stripe) {
      handleAllErrors(
        mapKeys("Could not redirect to checkout. Please try again")
      );
      return;
    }
    api
      .post("/create-checkout-session/", item)
      .then(async (response) => {
        if (response.status === 200 && response.data.url) {
          window.location.href = response.data.url;
        } else {
          handleAllErrors(
            mapKeys("Could not redirect to checkout. Please try again")
          );
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f8f8]">
      <nav className=" z-40 w-screen bg-green-200 shadow-md shadow-gray-300">
        <div className="flex w-full p-2 justify-between">
          <div className="flex items-center min-w-fit px-4 space-x-2 mr-auto md:mr-0">
            <p
              onClick={() => navigate("/")}
              className={`logo cursor-pointer h-14 w-14`}
            ></p>

            <h1 className="text-3xl font-bold font-spectral">Phaero</h1>
          </div>
        </div>
      </nav>
      <div className="flex flex-col pb-20">
        <div className="bg-white shadow-sm m-2 max-w-6xl xl:mt-12 mx-auto w-full ">
          <h1 className="gradient-text font-roboto text-4xl py-4 px-6">
            Pricing Plans
          </h1>
          <h2 className="font-roboto text-xl px-6 py-4">
            Get started on your health journey
          </h2>
        </div>
        <div className="flex w-full justify-center px-4 mx-auto items-center font-roboto py-8">
          <p
            className={`text-2xl text-right mr-4 w-[100px]  ${
              !monthly && "text-gray-500"
            } `}
          >
            Monthly
          </p>
          <FancyToggleButton
            active={!monthly}
            onClick={() => setMonthly(!monthly)}
          />
          <div className="relative">
            <p
              className={`text-2xl ml-4 w-[100px] ${
                monthly && "text-gray-500"
              } `}
            >
              Yearly
            </p>
            <p className="text-sky-400 absolute bottom-0 whitespace-nowrap translate-y-full">
              Get 2 months free
            </p>
          </div>
        </div>
        <div className="">
          <PricingTables
            monthly={monthly}
            redirectToCheckout={redirectToCheckout}
          />
        </div>
        <HandleObjections />
      </div>
    </div>
  );
}

export default PricingPage;
