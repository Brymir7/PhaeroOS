
import {
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,

  Box,
  useTheme,
} from "@mui/material";
import { useContext, useState } from "react";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { useFormattedFoodName } from "../../utils/CustomHooks";
import PaperButton from "../../homePage/PaperButton";
import { Add, Edit2 } from "iconsax-react";


interface Props {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditCustomFoodValues: React.Dispatch<
    React.SetStateAction<
      | {
          [key: string]: [number | string, string];
        }
      | undefined
    >
  >;
  editCustomFoodStats: (foodName: string) => void;
  foodNameList: string[];
  addCustomFoodToList: (foodName: string) => void;
}

const EditCustomFoods = ({
  setIsOpen,
  setEditCustomFoodValues,
  editCustomFoodStats,
  foodNameList,
  addCustomFoodToList,
}: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  const [showFoods, setShowFoods] = useState<boolean>(false);
  const formatFoodName = useFormattedFoodName();
    const theme = useTheme();
  return (
    <Paper elevation={2} className="">
      <div className="flex justify-center align-middle">
        <Typography variant="h6" className="" sx={{ pt: 1 }}>
          {mapKeys("Custom foods")}{" "}
        </Typography>
      </div>
      <Divider />
      <List
        sx={{
          width: "100%",
          borderRadius: "6px",
          maxWidth: 400,
          bgcolor: "background.paper",
          paddingBottom: "0px",
          paddingTop: "0px",
        }}
        component="nav"
        aria-labelledby="nested-list-subheader"
      >
        <ListItemButton
          onClick={() => {
            setEditCustomFoodValues(undefined);
            setIsOpen(true);
          }}
        >
          <ListItemText
            sx={{ paddingLeft: "10px" }}
            primary={mapKeys("Add a custom food")}
          />
                          <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />
        </ListItemButton>
        <Divider />
        <ListItemButton onClick={() => setShowFoods(!showFoods)}>
          <ListItemText
            sx={{ paddingLeft: "10px" }}
            primary={
              <div className="flex gap-1">
                <Typography>{mapKeys("Show all")}</Typography>
                <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2">
                  {foodNameList.length}
                </div>
              </div>
            }
          />

          <FontAwesomeIcon
            className={` ${showFoods && "rotate-180"}`}
            icon={faAngleUp}
          />
        </ListItemButton>
        {foodNameList && foodNameList.length > 0 && (
          <div className="overflow-y-auto max-h-[30vh]">
            <Divider />
            <Collapse in={showFoods} timeout="auto" unmountOnExit>
              <List>
                {foodNameList.map((foodName, index) => (
                  <ListItem key={index} sx={{ pl: 4 }}>
                    <ListItemText primary={                  <Typography variant="body2">
                    {formatFoodName(foodName)}
                  </Typography>} className="text-ellipsis pr-2"/>
                    <Box
                      component="div"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <PaperButton
                        icon={                <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />}
                        onClick={() => {
                          addCustomFoodToList(foodName);
                        }}
                        color="primary"
                                                normalSize="lg"
                        mobileSize="lg"
                      />
                      <PaperButton
                        icon={<Edit2 size={theme.iconSize.medium} color={theme.palette.primary.main} />}
                        onClick={() => {
                          editCustomFoodStats(foodName);
                        }}
                        color="primary"
                        normalSize="lg"
                        mobileSize="lg"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </div>
        )}
      </List>
    </Paper>
  );
};

export default EditCustomFoods;
