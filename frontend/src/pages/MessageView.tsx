import React, { useContext, useEffect, useRef } from "react";
import ChatMessageInputUI from "../components/homePage/ChatMessageInputUI";
import { Paper, useTheme } from "@mui/material";
import { useWindowWidth } from "../components/utils/CustomHooks";
import {
  JournalNoteContext,
  Message,
} from "../components/contexts/JournalNoteContext";
import CircularProgress from "@mui/material/CircularProgress";
import { MapKeysContext } from "../components/contexts/MapKeysContext";
import PhaeroMessage from "../components/homePage/PhaeroMessage";
import ToggleButtons, { ToggleButtonBluePrint } from "../components/homePage/ToggleButtons";
import { Lock1 } from "iconsax-react";

const MessageView: React.FC = () => {
  const { messages, isAnswering } = useContext(JournalNoteContext);
  const windowWidth = useWindowWidth();
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const scrollToLastUserMessage = () => {
    if (lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToLastUserMessage();
  }, [messages]);
  console.log(lastUserMessageRef);
  const renderMessage = (message: Message, index: number) => {
    const isLastUserMessage = index === messages.filter(m => m.typeof_message === "user").length - 1;

    if (message.typeof_message === "system") {
      const messageText = message.message.replace(/^Phaero:\s*/, "");
      return (
        <div style={{ maxWidth: "100%" }} key={index}>
          <PhaeroMessage
            key={index}
            message={messageText}
            currentMessageIndex={index}
            markdownText={messageText}
            isLastMessage={index === messages.length - 1}
            sender="Phaero"
            phaero_note_dict={message.phaero_note_dict as any}
            phaero_note_dict_diff={message.phaero_note_dict_diff_json}
            display={message.display}
            has_confirmed={message.has_confirmed}
            used_note_ids={message.used_note_ids}
          />
        </div>
      );
    } else {
      return (
        <div
          key={index}
          ref={isLastUserMessage ? lastUserMessageRef : null}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Paper
            elevation={3}
            style={{
              maxWidth: windowWidth > 768 ? "62%" : "75%",
              display: "inline-flex",
              padding: "1em",
              marginBottom: "10px",
              borderRadius: "calc(1em + 1.5em)/1em",
              borderInline: "1.5em solid #0000",
              mask: "radial-gradient(100% 100% at 100% 0,#0000 99%,#000 102%) 100%/1.5em 1.5em no-repeat, linear-gradient(#000 0 0) padding-box",
              background: theme.palette.primary.tertiaryText,
              color: "black",
              alignItems: "center",
              flexDirection: "column",
              fontSize: windowWidth < 768 ? "15px" : "18px",
            }}
          >
            <div
              style={{
                fontSize: windowWidth < 768 ? "15px" : "15px",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            ></div>
            {message.message}
          </Paper>
        </div>
      );
    }
  };
  const { messagingView, setMessagingView, canProcess } = useContext(JournalNoteContext);
  const buttons: ToggleButtonBluePrint[] = [
    { text: "Chat", icon: undefined, disabled: false, selected: messagingView },
    {
      text: "Daily Entry",
      icon: (messages.length === 0 || !canProcess) && (
        <Lock1 size={theme.iconSize.medium} className="mr-2" />
      ),
      disabled: messages.length === 0 || !canProcess,
      selected: !messagingView,
    },
  ];
  return (
    <Paper
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        borderRadius: "0px",
      }}
    >
      {true && (
        <Paper>
          <div className="mx-auto min-w-[95%] " >
            <ToggleButtons
              buttons={buttons}
              onToggle={(value) =>
                setMessagingView(value === "Chat" ? true : false)
              }
            />
          </div>
        </Paper >
      )}
      <div
        ref={containerRef}
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((message, index) => (
          <div key={index} ref={messages.map((m) => m.typeof_message).lastIndexOf("user") === index ? lastUserMessageRef : null}>
            {renderMessage(message, index)}
          </div>
        ))}

        {isAnswering && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              width: "100%",
              marginBottom: "10px",
            }}
          >
            <Paper
              elevation={3}
              style={{
                maxWidth: "80%",
                display: "inline-flex",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "15px",
                alignItems: "center",
              }}
            >
              <CircularProgress size={24} />
              <span style={{ marginLeft: "10px" }}>
                {mapKeys("Phaero is thinking...")}
              </span>
            </Paper>
          </div>
        )}
      </div>

      <div
        style={{ flexShrink: 0, boxShadow: "0px -3px 6px rgba(0, 0, 0, 0.1)" }}
      >
        <ChatMessageInputUI />
      </div>
    </Paper>
  );
};

export default MessageView;
