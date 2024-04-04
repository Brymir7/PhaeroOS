import { useContext, useState } from "react";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { Box, Divider, ListItemButton, Typography, useTheme } from "@mui/material";
import { useFormattedFoodName } from "../../utils/CustomHooks";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import PaperButton from "../../homePage/PaperButton";
import { Add, Edit2 } from "iconsax-react";

interface Props {
  searchList: [string[], string[], string[]];
  searchTerm: string;
  collapsedDefault?: boolean;
  localStorageList?: string[];
  handleSearchTerm: (item?: string) => void;
  editCustomFoodStats: (food: string) => void;
}

function NestedListWithCollapse({
  searchList,
  searchTerm,
  collapsedDefault,
  localStorageList,
  handleSearchTerm,
  editCustomFoodStats,
}: Props) {
  const collapseAll = collapsedDefault ? false : true;
  const [openUserFoods, setOpenUserFoods] = useState(collapseAll);
  const [openOurFoods, setOpenOurFoods] = useState(collapseAll);
  const [openOtherUsersFoods, setOpenOtherUsersFoods] = useState(collapseAll);
  const [openRecentFoods, setOpenRecentFoods] = useState(collapseAll);
  const formatFoodName = useFormattedFoodName();
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();
  return (
    <List
      sx={{
        width: "100%",
        maxWidth: 440,
        bgcolor: "background.paper",
        overflow: "auto",
        maxHeight: 500,
        pt: 0,
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      <ListItemButton onClick={() => setOpenUserFoods(!openUserFoods)}>
        <Box
          component="div"
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}
        >
          <Typography>{mapKeys("Custom foods")}</Typography>
          <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2">
            {searchList[0].length}
          </div>
        </Box>
        <FontAwesomeIcon
          className={` ${openUserFoods && "rotate-180"}`}
          icon={faAngleUp}
        />
      </ListItemButton>
      <Divider />

      <Collapse in={openUserFoods} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {searchList[0].map((item: string, index: number) => (
            <ListItemButton
              key={item + index}
              sx={{
                bgcolor:
                  item.toLowerCase() === searchTerm.toLowerCase()
                    ? "#e8e8e8"
                    : "inherit",
              }}
              onClick={() => handleSearchTerm(item)}
            >
              <ListItemText
                primary={
                  <Typography variant="body2">
                    {formatFoodName(item)}
                  </Typography>
                }
              />
              <div className="mr-2">
                <PaperButton icon={                <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />}></PaperButton>
              </div>
              <PaperButton
                icon={   <Edit2 size={theme.iconSize.medium} color={theme.palette.primary.main} />}
                onClick={(e) => {
                  e.stopPropagation();
                  editCustomFoodStats(item);
                }}
                color="primary"
                normalSize="1x"
                mobileSize="1x"
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <Divider />
      <ListItemButton
        onClick={() => setOpenOtherUsersFoods(!openOtherUsersFoods)}
      >
        <Box
          component="div"
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}
        >
          <Typography >{mapKeys("Other User Foods")}</Typography>
          <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2">
            {searchList[2].length}
          </div>
        </Box>
        <FontAwesomeIcon
          className={` ${openUserFoods && "rotate-180"}`}
          icon={faAngleUp}
        />
      </ListItemButton>
      <Divider />

      <Collapse in={openOtherUsersFoods} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {searchList[2].map((item: string, index: number) => (
            <ListItemButton
              key={item + index}
              sx={{
                bgcolor:
                  item.toLowerCase() === searchTerm.toLowerCase()
                    ? "#e8e8e8"
                    : "inherit",
              }}
              onClick={() => handleSearchTerm(item)}
            >
              <ListItemText
                primary={
                  <Typography variant="body2">
                    {formatFoodName(item)}
                  </Typography>
                }
              />
              <div className="mr-2">
                <PaperButton icon={                <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />}></PaperButton>
              </div>
              <PaperButton
                icon={   <Edit2 size={theme.iconSize.medium} color={theme.palette.primary.main} />}
                onClick={(e) => {
                  e.stopPropagation();
                  editCustomFoodStats(item);
                }}
                color="primary"
                normalSize="1x"
                mobileSize="1x"
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <Divider />
      <ListItemButton onClick={() => setOpenOurFoods(!openOurFoods)}>
        <Box
          component="div"
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}
        >
          <Typography>{mapKeys("Our foods")}</Typography>
          <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2">
            {searchList[1].length}
          </div>
        </Box>

        <FontAwesomeIcon
          className={` ${openOurFoods && "rotate-180"}`}
          icon={faAngleUp}
        />
      </ListItemButton>
      <Divider />

      <Collapse in={openOurFoods} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {searchList[1].map((item: string, index: number) => (
            <ListItemButton
              sx={{
                backgroundColor:
                  formatFoodName(item).toUpperCase() ===
                  searchTerm.toUpperCase()
                    ? "#e8e8e8"
                    : "inherit",
              }}
              key={item + index}
              onClick={() => handleSearchTerm(item)}
            >
              <ListItemText
                primary={
                 
                  <Typography variant="body2">
                    {formatFoodName(item)}
                  </Typography>
                }
              />
              <PaperButton icon={                <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />}></PaperButton>
            </ListItemButton>
          ))}
        </List>
      </Collapse>

      {localStorageList && localStorageList.length > 0 && (
        <>
          <Divider />
          <ListItemButton onClick={() => setOpenRecentFoods(!openRecentFoods)}>
            <Box
              component="div"
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 1,
              }}
            >
              <Typography >{mapKeys("Recently added")}</Typography>
              <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2">
                {localStorageList.length}
              </div>
            </Box>
            <FontAwesomeIcon
              className={` ${openRecentFoods && "rotate-180"}`}
              icon={faAngleUp}
            />
          </ListItemButton>
          <Divider />
          {localStorageList.length > 0 && (
            <Collapse in={openRecentFoods} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {localStorageList.map((item: string, index: number) => (
                  <ListItemButton
                    sx={{
                      backgroundColor:
                        formatFoodName(item).toUpperCase() ===
                        searchTerm.toUpperCase()
                          ? "#e8e8e8"
                          : "inherit",
                    }}
                    key={item + index}
                    onClick={() => handleSearchTerm(item)}
                  >
                    <ListItemText
                      primary={
                  <Typography variant="body2">
                    {formatFoodName(item)}
                  </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          )}
        </>
      )}
    </List>
  );
}

export default NestedListWithCollapse;
