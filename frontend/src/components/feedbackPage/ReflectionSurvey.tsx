import { Paper, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
} from "react-beautiful-dnd";
import {
  faCalendarWeek,
  faThumbsDown,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// A little function to help us with reordering the result
interface Item {
  id: string;
  content: string;
}

interface State {
  [key: string]: Item[];
}

const initialItems: State = {
  listOne: [
    { id: "Last Week", content: "Last Week" },
    { id: "The Week Before Last", content: "The Week Before Last" },
  ],
  listTwo: [{ id: "This Week", content: "This Week" }],
};

// A little function to help us with reordering the result
const reorder = (
  list: Item[],
  startIndex: number,
  endIndex: number
): Item[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Moves an item from one list to another list
const move = (
  source: Item[],
  destination: Item[],
  droppableSource: {
    index: number;
    droppableId: string;
  },
  droppableDestination: {
    index: number;
    droppableId: string;
  }
): { [key: string]: Item[] } => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result: { [key: string]: Item[] } = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};

interface Props {
  setSurveyAnswer: (answer: string) => void;
}
const ReflectionSurvey = ({ setSurveyAnswer }: Props) => {
  const [state, setState] = useState<State>(initialItems);
  const { mapKeys } = useContext(MapKeysContext);

  const onDragEnd = (result: DropResult): void => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination || destination.droppableId === "listTwo") {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        state[source.droppableId],
        source.index,
        destination.index
      );
      const newState = { ...state, [source.droppableId]: items };
      setState(newState);
    } else {
      const result = move(
        state[source.droppableId],
        state[destination.droppableId],
        source,
        destination
      );
      setState((prevState) => ({
        ...prevState,
        ...result,
      }));
    }
  };

  useEffect(() => {
    if (state.listOne.length < 3) setSurveyAnswer("");
    else {
      let answerIndex = 0;
      state.listOne.forEach((item, index) => {
        if (item.id === "This Week") answerIndex = index;
      });
      setSurveyAnswer(
        answerIndex === 0 ? "good" : answerIndex === 1 ? "ok" : "bad"
      );
    }
  }, [state]);

  return (
    <div className="flex flex-col py-4 px-2">
      <Paper elevation={2} className="px-4 py-2">
        <Typography sx={{ fontSize: "18px" }}>
          {mapKeys("How was your week compared to the last two?")}
        </Typography>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="font-bold text-xl mb-2 mt-4">
            <FontAwesomeIcon color="#55c22e" icon={faThumbsUp} />
          </div>

          <Droppable droppableId={"listOne"}>
            {(provided: DroppableProvided) => (
              <ul
                className="characters"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {state["listOne"].map(({ id, content }, index) => {
                  return (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className=" mx-2">
                            <FontAwesomeIcon
                              color="#9E9E9E"
                              icon={faCalendarWeek}
                            />
                          </div>
                          <p>{mapKeys(content)}</p>
                        </li>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>

          <div className="text-xl font-bold mt-2">
            <FontAwesomeIcon color="#f44336" icon={faThumbsDown} />
          </div>

          {state["listTwo"].length > 0 && (
            <Droppable droppableId={"listTwo"} isDropDisabled={true}>
              {(provided: DroppableProvided) => (
                <ul
                  className="characters mt-6"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {state["listTwo"].map(({ id, content }, index) => {
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className=" mx-2">
                              <FontAwesomeIcon
                                color="#9E9E9E"
                                icon={faCalendarWeek}
                              />
                            </div>
                            <p>{mapKeys(content)}</p>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          )}
        </DragDropContext>
      </Paper>
    </div>
  );
};

export default ReflectionSurvey;
