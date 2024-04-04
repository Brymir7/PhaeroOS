import React from "react";
import QuestionDropdown from "./QuestionDropdown";

function HandleObjections() {
  const [isOpen, setIsOpen] = React.useState<number>(0); // 0 = none 1 = first question, 2 = second question, etc.
  const handleClick = (index: number) => {
    if (isOpen === index) setIsOpen(0);
    else setIsOpen(index);
  };

  return (
    <div className="flex flex-col h-auto bg-[#f8f8f8] pb-6 space-y-8 w-full items-center">
      <h1 className="font-roboto text-xl lg:text-2xl xl:text-3xl text-center pt-6 pb-4">
        Frequently Asked Questions
      </h1>
      <QuestionDropdown
        heading="Why should I use Phaero instead of a tracking app?"
        text="Phaero stands out from tracking apps like MyFitnessPal, Cronometer, Apple Watch, and Samsung Health by seamlessly capturing the connection between your activities and well-being in a more big picture approach with the focus on journaling instead of tracking. Our user-friendly interface still ensures a painless tracking experience, but that's just a side effect. We don't plan on competing with these apps, instead we plan on expanding upon their ideas by connecting the dots. Phaero empowers you to uncover lifestyle patterns in your life, that make you feel the best."
        isOpen={isOpen === 1}
        index={1}
        setIsOpen={handleClick}
      ></QuestionDropdown>
      <QuestionDropdown
        isOpen={isOpen === 2}
        index={2}
        setIsOpen={handleClick}
        heading="How is the feedback created?"
        text="Phaero uses your daily journal entries, emphasizing on mental and physical health indicators to craft your feedback."
      ></QuestionDropdown>
      <QuestionDropdown
        heading="What happens to my data/notes?"
        text="Your data is securely processed to enhance the quality of feedback we provide. We use your notes in an anonymous manner to refine our models. We plan on creating a local-only storage solution for your notes, so you can have full control over your data. See the changelog for future updates."
        isOpen={isOpen === 3}
        index={3}
        setIsOpen={handleClick}
      ></QuestionDropdown>
      <QuestionDropdown
        heading="I never journaled before, is Phaero for me?"
        text="Phaero is designed to be a tool that helps you to reflect on your day and to help you to understand yourself better. We believe that everyone can benefit from journaling, and we want to make it as easy as possible for you. To get started, you can just tell us about your day in a voice message and over time it will come easy to you."
        isOpen={isOpen === 4}
        index={4}
        setIsOpen={handleClick}
      ></QuestionDropdown>
    </div>
  );
}

export default HandleObjections;
