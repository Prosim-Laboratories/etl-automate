sudo systemctl daemon-reload
sudo systemctl restart prosim_labs_website.service
sudo systemctl restart caddy
# sudo systemctl status prosim_labs_website.service
sudo journalctl -fu prosim_labs_website.service