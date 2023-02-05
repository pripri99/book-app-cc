
help:
	@echo "--------------------------------------"
	@echo " lee Makefile "
	@echo 
	@echo "  with docker-compose:"
	@echo 
	@echo " make appup"
	@echo " make appdown"
	@echo 
	@echo "--------------------------------------"

# -------------------------------------------------------
# recordar: docker inspect
# -------------------------------------------------------

# -------------------------------------------------------
#  
#  con docker-compose
#
# -------------------------------------------------------
appup:
	docker-compose up
	docker exec keycloak /opt/jboss/keycloak/bin/add-user-keycloak.sh -u admin -p admin && docker restart keycloak
	
appdown:
	docker-compose down 
	@echo "---------------------------------"
	docker ps -a
	@echo "---------------------------------"
	docker images
	@echo "---------------------------------"

# -------------------------------------------------------
#
# utilidades
#
# -------------------------------------------------------
#
# ver imagenes
#
ls:
	docker images

#
# ver contenedoroes
#
ps:
	clear
	@echo "---------------------------------"
	@echo "---------------------------------"
	docker ps -a
	@echo "---------------------------------"
	@echo "---------------------------------"

#
# borrar todos los contenedores
#
rmcont:
	docker rm `docker ps -aq` || true
#wc -l `ls`

#
# borrar todas las imagenes
#
rmimg:
	docker rmi `docker images -aq` || true

#
# borrar contenedores e imagenes
#
clean: rmcont rmimg
	docker rmi servidordatos_servidordatos zmqlogica_img || true
	@echo
	docker ps -a
	@echo
	docker images

