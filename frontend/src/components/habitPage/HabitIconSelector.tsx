import React, { useContext } from "react";
import {
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faBicycle,
  faRunning,
  faDumbbell,
  faSpa,
  faPen,
  faPeace,
  faOm,
  faShower,
  faWater,
  faClock,
  faUserCircle,
  faSmile,
  faStar,
  faBook,
  faUtensils,
  faHamburger,
  faCoffee,
  faSpoon,
  faSpaceShuttle,
  faRocket
} from "@fortawesome/free-solid-svg-icons";
import { MapKeysContext } from "../contexts/MapKeysContext";

const iconsMap = {
  faHeart,
  faBicycle,
  faRunning,
  faDumbbell,
  faSpa,
  faPen,
  faPeace,
  faOm,
  faShower,
  faWater,
  faClock,
  faUserCircle,
  faSmile,
  faStar,
  faBook,
  faUtensils,
  faHamburger,
  faCoffee,
    faSpoon,
  faSpaceShuttle,
  faRocket
};

const IconSelectorPopup = ({
  onClose,
  onIconSelect,
}: {
  onClose: () => void;
  onIconSelect: (icon: any) => void;
}) => {
  const handleIconSelect = (icon: any) => {
    onIconSelect(icon);
    onClose();
  };
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Dialog onClose={onClose} open={true} fullWidth>
      <DialogTitle>{mapKeys("Choose an Icon")}</DialogTitle>
      <List sx={{ pt: 0, maxHeight: "50vh", overflow: "auto" }}>
        {Object.keys(iconsMap).map((iconKey) => (
          <ListItem
            button
            onClick={() => handleIconSelect(iconKey)}
            key={iconKey}
          >
            <ListItemIcon>
              <FontAwesomeIcon
                icon={iconsMap[iconKey as keyof typeof iconsMap]}
              />
            </ListItemIcon>
            <ListItemText
              primary={mapKeys(iconKey.split("fa").toString().replace(",", ""))}
            />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};
type IconSelectorPopupProps = {
  onClose: () => void;
  onIconSelect: (icon: any) => void;
};
const HabitIconSelector: React.FC<IconSelectorPopupProps> = ({
  onClose,
  onIconSelect,
}) => {
  return (
    <>
      <IconSelectorPopup onClose={onClose} onIconSelect={onIconSelect} />
    </>
  );
};

export default HabitIconSelector;
