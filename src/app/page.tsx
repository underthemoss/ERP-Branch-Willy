import { Button } from "@mui/joy";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";

export default function Home() {
  return (
    <div>
      <Button startDecorator={<AccessAlarmIcon />}>test</Button>
    </div>
  );
}
